import type { RosSocket, RosSocketConstructor } from "@/registry/syncrobotic/lib/ros"

/** What the client sent, parsed: one object per frame. */
export type Sent = Record<string, unknown> & { op: string }

/**
 * A WebSocket that never touches the network, with the server's side in the test's hands: `open()`, `drop()` and `emit()`
 * play rosbridge, `sent` is every frame the client wrote. Sending on a socket that is not open throws, as the browser's does,
 * so a test fails if the client forgets to wait for `open`.
 */
export class FakeSocket implements RosSocket {
  readyState = 0
  sent: Sent[] = []
  closedByClient = false
  onopen: RosSocket["onopen"] = null
  onclose: RosSocket["onclose"] = null
  onerror: RosSocket["onerror"] = null
  onmessage: RosSocket["onmessage"] = null
  constructor(
    readonly url: string,
    private readonly log: Sent[],
  ) {}
  send(data: string) {
    if (this.readyState !== 1) throw new Error("InvalidStateError: the socket is not open")
    const frame = JSON.parse(data) as Sent
    this.sent.push(frame)
    this.log.push(frame)
  }
  close() {
    this.closedByClient = true
    this.readyState = 3
  }
  open() {
    this.readyState = 1
    this.onopen?.({})
  }
  /** The server or the network ends the connection. */
  drop(code = 1006) {
    this.readyState = 3
    this.onerror?.({})
    this.onclose?.({ code, reason: "" })
  }
  emit(message: unknown) {
    this.onmessage?.({ data: typeof message === "string" ? message : JSON.stringify(message) })
  }
}

/** A WebSocket constructor for one test, with every socket it made and every frame sent on any of them. */
export function fakeRosbridge() {
  const sockets: FakeSocket[] = []
  const log: Sent[] = []
  const WebSocket: RosSocketConstructor = class extends FakeSocket {
    constructor(url: string) {
      super(url, log)
      sockets.push(this)
    }
  }
  return {
    WebSocket,
    sockets,
    log,
    /** The newest socket. */
    get last(): FakeSocket {
      const s = sockets.at(-1)
      if (!s) throw new Error("No socket was opened")
      return s
    },
    ops: (op?: string) => (op ? log.filter((f) => f.op === op) : log),
  }
}
