// @syncrobotic/ros v0.45.1 · update: npx shadcn add @syncrobotic/ros --overwrite
/*
  ROS and ROS 2 in the browser, without a ROS library: the rosbridge v2 protocol (rosbridge_suite, which serves both ROS 1
  and ROS 2) spoken directly over the browser's WebSocket, and pure converters from the messages to the props the kit's
  components take. No React here: `use-ros` is the React layer on top.

  What the connection does, so an app does not write it again:
  - one wire subscription per topic, however many listeners (ref-counted), resent after every reconnect;
  - one advertisement per topic, ref-counted the same way, also resent after a reconnect;
  - reconnects with capped, jittered exponential backoff, and says which state it is in (connecting, open, closed, error);
  - holds publishes and service calls made while it is not open, and sends them once it is;
  - service calls with a timeout;
  - for velocity topics, a stop (a zero Twist) when the publisher goes away, when the link drops, and when the app asks.

  What it cannot do: rosbridge has no watchdog. If the browser freezes or the network drops mid-drive, the last command the
  robot received may be a non-zero one, and nothing this file does can reach the robot until the link is back. The robot
  must stop by itself when commands stop arriving (a command timeout in its base controller or twist_mux).
*/

// --- Transport ----------------------------------------------------------------------------------------------------

/**
 * The parts of a WebSocket the connection uses. The browser's WebSocket fits; a test passes a fake with the same shape.
 * Handlers are assigned, never read back, so a socket may type them more narrowly.
 */
export interface RosSocket {
  readonly readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
  onopen: ((event: unknown) => void) | null
  onclose: ((event: { code?: number; reason?: string }) => void) | null
  onerror: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
}

export type RosSocketConstructor = new (url: string) => RosSocket

/**
 * - `connecting`: a socket is opening.
 * - `open`: messages flow.
 * - `error`: the last attempt failed or the link dropped; `retryAt` says when the next attempt starts (none with
 *   `reconnect: false`).
 * - `closed`: not connected because the app has not connected yet, or closed it.
 */
export type RosConnectionState = "connecting" | "open" | "closed" | "error"

export type RosStatus = {
  state: RosConnectionState
  /** The last thing that went wrong: the socket's error, a failed attempt, or a `status` message rosbridge sent. */
  error?: Error
  /** Attempts since the connection was last open. 0 while open. */
  attempt: number
  /** When the next attempt starts, in ms since the epoch, while `state` is `error` and a retry is scheduled. */
  retryAt?: number
  /** Round trip of the last heartbeat, in ms. Only with `heartbeat`: rosbridge has no ping of its own. */
  latencyMs?: number
}

export type RosReconnect = {
  /** The first wait, in ms. Default 500. */
  minDelayMs?: number
  /** The longest wait, in ms. Default 10 000. */
  maxDelayMs?: number
  /** Each failed attempt multiplies the wait by this. Default 2. */
  factor?: number
}

export type RosHeartbeat = {
  /** A service that answers quickly. Default `/rosapi/get_time`, which rosbridge_websocket_launch.xml starts. */
  service?: string
  /** Its type, for rosbridge versions that want it. Default `rosapi/GetTime`. */
  type?: string
  /** Default 5000. */
  intervalMs?: number
  /** No answer within this is a dead link: the socket is closed and the connection reconnects. Default 4000. */
  timeoutMs?: number
}

export type RosConnectionOptions = {
  /** The rosbridge server: `ws://robot.local:9090`. Use `wss://` from a page served over https. */
  url: string
  /** `true` (the default) reconnects with the default backoff; `false` stays in `error` after a drop. */
  reconnect?: boolean | RosReconnect
  /**
   * Calls a service on an interval to measure latency and to notice a link that died without closing (a half-open TCP
   * connection can look open for minutes). Off by default, since the service may not exist.
   */
  heartbeat?: boolean | RosHeartbeat
  /** A socket still opening after this is given up on and retried. Default 10 000. */
  connectTimeoutMs?: number
  /** Publishes and calls held while not open, at most. The oldest goes first. Default 100. */
  maxQueue?: number
  /** A held publish older than this is dropped instead of sent late. Default 5000. */
  queueTtlMs?: number
  /** The WebSocket constructor. Default: the global one. */
  WebSocket?: RosSocketConstructor
  /** 0…1, for the backoff's jitter. Default Math.random; a test passes a fixed one. */
  random?: () => number
}

export type RosSubscribeOptions = {
  /** Ask rosbridge to send at most one message per this many ms (`throttle_rate`). */
  throttleMs?: number
  /** Messages rosbridge may buffer while throttling (`queue_length`). */
  queueLength?: number
}

export type RosCallOptions = {
  /** The service type, sent for rosbridge versions that need it to find a service not yet seen. */
  type?: string
  /** Reject after this many ms. Default 10 000. The clock runs while the call waits for the connection too. */
  timeoutMs?: number
}

export type RosPublisherOptions<T> = {
  /**
   * What to send to stop: on `release()`, on `stop()` and when the link drops, if the last message sent was not a stop.
   * Default: a zero Twist for `geometry_msgs/Twist` and `TwistStamped`, nothing for other types. `null` turns it off.
   */
  stopMessage?: T | null
  /** Whether a message is a stop. Default: deep equality with `stopMessage`, numbers compared as numbers. */
  isStop?: (message: T) => boolean
}

export type RosStopReason = "release" | "connection-lost" | "hidden" | "app"

/**
 * A publisher on one topic. Nothing is advertised until the first publish; `release()` takes it back, and the next
 * publish advertises again, so one object can live through React's StrictMode remount.
 */
export type RosPublisher<T> = {
  readonly topic: string
  readonly type: string
  /**
   * Sends the message, or holds it until the connection is open. Returns false when it was dropped: a velocity command
   * while not open (never held, so it cannot arrive late), or any non-stop message after a stop until a stop is published
   * again (see `stop`).
   */
  publish: (message: T) => boolean
  /**
   * If the last message sent was not a stop, sends the stop message and refuses further non-stop messages until the app
   * publishes a stop itself: after the page hid or the link dropped, a drive resumes only from a fresh press, never
   * from a stick that was still held.
   */
  stop: (reason?: RosStopReason) => void
  /** Stops (as `stop`), then unadvertises once no other publisher holds the topic. */
  release: () => void
}

export class RosTimeoutError extends Error {
  constructor(what: string, ms: number) {
    super(`${what}: no answer within ${ms} ms`)
    this.name = "RosTimeoutError"
  }
}

export class RosServiceError extends Error {
  /** What rosbridge sent back as `values`: usually a string saying why. */
  readonly values: unknown
  constructor(service: string, values: unknown) {
    super(`${service} failed${typeof values === "string" && values ? `: ${values}` : ""}`)
    this.name = "RosServiceError"
    this.values = values
  }
}

export class RosConnectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RosConnectionError"
  }
}

/** The connection the hooks share. Create it once per rosbridge server. */
export type RosConnection = {
  readonly url: string
  /** Opens the socket (and keeps reopening it, with `reconnect`). Safe to call again; a no-op while connecting or open. */
  connect: () => void
  /** Closes the socket and stops reconnecting. Subscriptions and publishers stay registered for the next `connect()`. */
  close: () => void
  /** Skips the backoff wait and tries now (a Reconnect button). */
  reconnectNow: () => void
  getStatus: () => RosStatus
  subscribeStatus: (listener: () => void) => () => void
  /** Listens to a topic; returns the function that stops listening. One wire subscription per topic, however many listeners. */
  subscribe: <T = unknown>(topic: string, type: string, listener: (message: T) => void, options?: RosSubscribeOptions) => () => void
  /** The last message on a topic someone is subscribed to, or undefined. */
  latest: <T = unknown>(topic: string) => T | undefined
  /** A ref-counted publisher on a topic. Creating it sends nothing. */
  publisher: <T = unknown>(topic: string, type: string, options?: RosPublisherOptions<T>) => RosPublisher<T>
  /** Calls a service and resolves with its response `values`. */
  call: <Req = unknown, Res = unknown>(service: string, request: Req, options?: RosCallOptions) => Promise<Res>
}

// WebSocket.OPEN, written out so a fake socket and a server-side render need no global.
const OPEN = 1

type Listener = (message: unknown) => void
type Subscription = {
  topic: string
  type: string
  id: string
  listeners: Map<Listener, RosSubscribeOptions>
  latest?: unknown
  /** The options last sent, so a change in what the listeners ask for is sent again under the same id (rosbridge updates it). */
  sent?: string
}
type Advertisement = { topic: string; type: string; id: string; holders: number; linger?: ReturnType<typeof setTimeout> }
/** A message waiting for the socket. `stop` never expires: a stop sent late is still safe, and it may be the robot's only one. */
type Held = { at: number; message: Record<string, unknown>; topic?: string; callId?: string; stop?: boolean }
type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout>; sent: boolean; service: string }

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())
const TWIST = /^geometry_msgs\/(msg\/)?Twist$/
const TWIST_STAMPED = /^geometry_msgs\/(msg\/)?TwistStamped$/
// A topic's advertisement outlives its last publisher by this long, so a stop published just before is delivered before
// rosbridge tears the publisher down, and a StrictMode remount keeps the same advertisement.
const UNADVERTISE_AFTER_MS = 500
// A fragmented message (rosbridge's `fragment_size`) larger than this many parts is refused rather than allocated: a
// corrupt or hostile `total` must not reserve gigabytes. 10 000 parts of rosbridge's usual 100 kB is a 1 GB message.
const MAX_FRAGMENTS = 10_000
// A fragmented message whose next part has not come for this long is dropped: a part lost on the way would otherwise keep
// the rest in memory for the life of the connection.
const FRAGMENT_TIMEOUT_MS = 10_000

/** The stop message a type gets by default: a zero Twist for the velocity types, nothing for others. */
export function defaultStopMessage(type: string): unknown {
  if (TWIST.test(type)) return zeroTwist()
  if (TWIST_STAMPED.test(type)) return { header: { frame_id: "" }, twist: zeroTwist() }
  return undefined
}

function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return a === b || (Number.isNaN(a) && Number.isNaN(b))
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return a === b
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  return ka.every((k) => sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

/**
 * rosbridge writes NaN and ±Infinity (a LaserScan with no return) as bare tokens on some versions, which is not JSON.
 * Only when the plain parse fails, those tokens after a `:`, `,` or `[` become null, which the converters read as NaN.
 */
export function parseRosJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (first) {
    const fixed = text.replace(/([:,[]\s*)(-?Infinity|NaN)(?=\s*[,\]}])/g, "$1null")
    if (fixed === text) throw first
    return JSON.parse(fixed)
  }
}

function report(error: unknown) {
  // A listener that throws must not stop the others or the socket's handler; the error still reaches the console.
  // timer-ok: rethrows on a fresh stack so the console shows it; nothing to clear.
  if (typeof reportError === "function") reportError(error)
  else setTimeout(() => {
    throw error
  })
}

/** Creates the connection. Nothing happens on the network until `connect()`. */
export function createRosConnection(options: RosConnectionOptions): RosConnection {
  const { url, connectTimeoutMs = 10_000, maxQueue = 100, queueTtlMs = 5_000, random = Math.random } = options
  const backoff = options.reconnect === false ? null : { minDelayMs: 500, maxDelayMs: 10_000, factor: 2, ...(options.reconnect === true ? {} : options.reconnect) }
  const heartbeat = !options.heartbeat
    ? null
    : { service: "/rosapi/get_time", type: "rosapi/GetTime", intervalMs: 5_000, timeoutMs: 4_000, ...(options.heartbeat === true ? {} : options.heartbeat) }

  let socket: RosSocket | null = null
  let wanted = false
  let status: RosStatus = { state: "closed", attempt: 0 }
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let beatTimer: ReturnType<typeof setTimeout> | undefined
  let seq = 0
  const statusListeners = new Set<() => void>()
  const subs = new Map<string, Subscription>()
  const ads = new Map<string, Advertisement>()
  const held: Held[] = []
  const pending = new Map<string, Pending>()
  const fragments = new Map<string, { total: number; parts: string[]; count: number; timer: ReturnType<typeof setTimeout> | undefined }>()
  function dropFragments() {
    for (const f of fragments.values()) clearTimeout(f.timer)
    fragments.clear()
  }
  /** Publishers that stop on a dropped link: each one's stop() is called when the link is lost. */
  const stoppers = new Set<(reason: RosStopReason) => void>()

  const nextId = (what: string) => `${what}:${++seq}`

  function setStatus(next: Partial<RosStatus>) {
    status = { ...status, ...next }
    for (const l of [...statusListeners]) {
      try {
        l()
      } catch (e) {
        report(e)
      }
    }
  }

  const isOpen = () => socket !== null && socket.readyState === OPEN && status.state === "open"

  function sendNow(message: Record<string, unknown>) {
    socket?.send(JSON.stringify(message))
  }

  function hold(entry: Held) {
    // A topic is state, not a log: a newer message on the same topic replaces the one still waiting.
    if (entry.topic !== undefined) {
      const i = held.findIndex((h) => h.topic === entry.topic)
      if (i >= 0) held.splice(i, 1)
    }
    held.push(entry)
    while (held.length > maxQueue) {
      const dropped = held.shift()
      if (dropped?.callId) failCall(dropped.callId, new RosConnectionError("Dropped from the send queue: too many messages waiting"))
    }
  }

  function subscribeMessage(sub: Subscription) {
    // Several listeners on one topic share the wire subscription: the fastest rate any asks for, the longest queue.
    let throttle = Infinity
    let queue = 0
    for (const o of sub.listeners.values()) {
      throttle = Math.min(throttle, Math.max(0, o.throttleMs ?? 0))
      queue = Math.max(queue, Math.max(0, o.queueLength ?? 0))
    }
    const message: Record<string, unknown> = { op: "subscribe", id: sub.id, topic: sub.topic, type: sub.type, compression: "none" }
    if (Number.isFinite(throttle) && throttle > 0) message.throttle_rate = Math.round(throttle)
    if (queue > 0) message.queue_length = Math.round(queue)
    return message
  }

  function syncSubscription(sub: Subscription) {
    const message = subscribeMessage(sub)
    const key = JSON.stringify(message)
    if (sub.sent === key || !isOpen()) return
    sub.sent = key
    sendNow(message)
  }

  function onOpen() {
    clearTimeout(openTimer)
    setStatus({ state: "open", attempt: 0, retryAt: undefined, error: undefined })
    // Order matters: subscriptions and advertisements first, then what was held, so a held stop on a velocity topic goes out
    // on its advertisement before anything else does.
    for (const sub of subs.values()) {
      sub.sent = undefined
      syncSubscription(sub)
    }
    for (const ad of ads.values()) if (ad.holders > 0 || ad.linger) sendNow({ op: "advertise", id: ad.id, topic: ad.topic, type: ad.type })
    const cutoff = now() - queueTtlMs
    for (const h of held.splice(0)) {
      if (h.callId) {
        const p = pending.get(h.callId)
        if (!p) continue
        p.sent = true
      } else if (h.at < cutoff && !h.stop) continue
      sendNow(h.message)
    }
    scheduleBeat()
  }

  function failCall(id: string, error: Error) {
    const p = pending.get(id)
    if (!p) return
    clearTimeout(p.timer)
    pending.delete(id)
    p.reject(error)
  }

  function detach(s: RosSocket) {
    s.onopen = s.onclose = s.onerror = s.onmessage = null
  }

  function lost(error: Error) {
    clearTimeout(openTimer)
    clearTimeout(beatTimer)
    if (socket) detach(socket)
    socket = null
    // Calls already sent will never be answered on this socket.
    for (const [id, p] of pending) if (p.sent) failCall(id, new RosConnectionError("The connection closed before the service answered"))
    for (const sub of subs.values()) sub.sent = undefined
    dropFragments()
    for (const stop of [...stoppers]) stop("connection-lost")
    if (!wanted) return setStatus({ state: "closed", error, retryAt: undefined, latencyMs: undefined })
    if (!backoff) return setStatus({ state: "error", error, retryAt: undefined, latencyMs: undefined })
    const attempt = status.attempt + 1
    // Equal jitter: half the wait is fixed, half random, so many tabs that lost the same server do not return in step.
    const base = Math.min(backoff.maxDelayMs, backoff.minDelayMs * backoff.factor ** (attempt - 1))
    const delay = base / 2 + (random() * base) / 2
    setStatus({ state: "error", error, attempt, retryAt: Date.now() + delay, latencyMs: undefined })
    retryTimer = setTimeout(open, delay)
  }

  function open() {
    clearTimeout(retryTimer)
    retryTimer = undefined
    if (!wanted || socket) return
    const Ctor = options.WebSocket ?? (globalThis.WebSocket as unknown as RosSocketConstructor | undefined)
    if (!Ctor) return setStatus({ state: "error", error: new RosConnectionError("No WebSocket in this environment") })
    let s: RosSocket
    try {
      s = new Ctor(url)
    } catch (e) {
      // A malformed URL throws at once; it will not get better by retrying.
      return setStatus({ state: "error", error: e instanceof Error ? e : new RosConnectionError(String(e)), retryAt: undefined })
    }
    socket = s
    setStatus({ state: "connecting", retryAt: undefined })
    openTimer = setTimeout(() => {
      if (socket !== s) return
      detach(s)
      s.close()
      lost(new RosConnectionError(`Could not connect to ${url} within ${connectTimeoutMs} ms`))
    }, connectTimeoutMs)
    s.onopen = () => {
      if (socket === s) onOpen()
    }
    s.onerror = () => {
      // The browser says nothing about why; the close that follows carries the code.
      if (socket === s && status.state === "open") setStatus({ error: new RosConnectionError(`The connection to ${url} failed`) })
    }
    s.onclose = (event) => {
      if (socket !== s) return
      const was = status.state
      const code = event?.code
      lost(new RosConnectionError(was === "open" ? `Connection to ${url} lost${code ? ` (code ${code})` : ""}` : `Could not connect to ${url}${code ? ` (code ${code})` : ""}`))
    }
    s.onmessage = (event) => {
      if (socket === s) receive(event.data)
    }
  }

  function receive(data: unknown) {
    if (typeof data !== "string") {
      setStatus({ error: new RosConnectionError("Received a binary message: only JSON (compression \"none\") is supported") })
      return
    }
    let message: unknown
    try {
      message = parseRosJson(data)
    } catch {
      setStatus({ error: new RosConnectionError("Received a message that is not JSON") })
      return
    }
    handle(message)
  }

  function handle(message: unknown) {
    if (!message || typeof message !== "object") return
    const m = message as Record<string, unknown>
    switch (m.op) {
      case "publish": {
        const sub = typeof m.topic === "string" ? subs.get(m.topic) : undefined
        if (!sub) return
        sub.latest = m.msg
        for (const listener of [...sub.listeners.keys()]) {
          try {
            listener(m.msg)
          } catch (e) {
            report(e)
          }
        }
        return
      }
      case "service_response": {
        const id = typeof m.id === "string" ? m.id : undefined
        const p = id ? pending.get(id) : undefined
        if (!id || !p) return
        clearTimeout(p.timer)
        pending.delete(id)
        // rosbridge for ROS 1 before 0.11 sent no `result`; a response without one is a success.
        if (m.result === false) p.reject(new RosServiceError(p.service, m.values))
        else p.resolve(m.values)
        return
      }
      case "fragment": {
        const id = String(m.id)
        const total = Number(m.total)
        const num = Number(m.num)
        if (!(Number.isInteger(total) && Number.isInteger(num) && total > 0 && num >= 0 && num < total) || typeof m.data !== "string") return
        if (total > MAX_FRAGMENTS) {
          setStatus({ error: new RosConnectionError(`A fragmented message of ${total} parts was refused (at most ${MAX_FRAGMENTS})`) })
          return
        }
        const f = fragments.get(id) ?? { total, parts: new Array<string>(total).fill(""), count: 0, timer: undefined }
        // A part that disagrees about the count belongs to no message this one can finish.
        if (f.total !== total) return
        fragments.set(id, f)
        clearTimeout(f.timer)
        f.timer = setTimeout(() => fragments.delete(id), FRAGMENT_TIMEOUT_MS)
        if (!f.parts[num]) f.count++
        f.parts[num] = m.data
        if (f.count < f.total) return
        clearTimeout(f.timer)
        fragments.delete(id)
        try {
          handle(parseRosJson(f.parts.join("")))
        } catch {
          setStatus({ error: new RosConnectionError("A fragmented message did not reassemble") })
        }
        return
      }
      case "status": {
        // rosbridge's own reports: an unknown type, a failed advertise. They do not change the connection's state.
        if (m.level === "error" || m.level === "warning") setStatus({ error: new RosConnectionError(String(m.msg ?? "rosbridge reported an error")) })
        return
      }
    }
  }

  function scheduleBeat() {
    clearTimeout(beatTimer)
    if (!heartbeat) return
    beatTimer = setTimeout(beat, heartbeat.intervalMs)
  }

  function beat() {
    if (!heartbeat || !isOpen()) return
    const s = socket
    const start = now()
    call(heartbeat.service, {}, { type: heartbeat.type, timeoutMs: heartbeat.timeoutMs }).then(
      () => {
        if (socket !== s) return
        setStatus({ latencyMs: Math.round(now() - start) })
        scheduleBeat()
      },
      (e: unknown) => {
        if (socket !== s || !s) return
        if (e instanceof RosTimeoutError) {
          // No answer from a socket that still says it is open: the link is dead without having closed. Close it so the
          // app hears of it and the connection starts over.
          detach(s)
          s.close()
          lost(new RosConnectionError(`No heartbeat from ${url} within ${heartbeat.timeoutMs} ms`))
        }
        // Any other failure (no rosapi on this robot) ends the heartbeat; the link itself is fine.
      },
    )
  }

  function connect() {
    wanted = true
    if (socket || retryTimer) return
    open()
  }

  function close() {
    wanted = false
    clearTimeout(retryTimer)
    retryTimer = undefined
    // Stop what is moving while the socket can still carry it.
    if (isOpen()) for (const stop of [...stoppers]) stop("release")
    const s = socket
    if (s) {
      detach(s)
      s.close(1000)
    }
    socket = null
    clearTimeout(openTimer)
    clearTimeout(beatTimer)
    for (const id of [...pending.keys()]) failCall(id, new RosConnectionError("The connection was closed"))
    for (const sub of subs.values()) sub.sent = undefined
    dropFragments()
    setStatus({ state: "closed", attempt: 0, retryAt: undefined, latencyMs: undefined })
  }

  function reconnectNow() {
    if (!wanted || socket) return
    open()
  }

  function subscribe<T>(topic: string, type: string, listener: (message: T) => void, opts: RosSubscribeOptions = {}) {
    let sub = subs.get(topic)
    if (!sub) {
      sub = { topic, type, id: nextId(`subscribe:${topic}`), listeners: new Map() }
      subs.set(topic, sub)
    }
    const l = listener as Listener
    sub.listeners.set(l, opts)
    syncSubscription(sub)
    const mine = sub
    let done = false
    return () => {
      if (done) return
      done = true
      mine.listeners.delete(l)
      // Wait a microtask before unsubscribing on the wire: React's StrictMode, or a hook whose options changed, takes a
      // listener away and puts one back in the same commit, and that should not cost the server a resubscribe.
      queueMicrotask(() => {
        if (subs.get(topic) !== mine) return
        if (mine.listeners.size > 0) return syncSubscription(mine)
        subs.delete(topic)
        if (isOpen() && mine.sent) sendNow({ op: "unsubscribe", id: mine.id, topic })
      })
    }
  }

  function latest<T>(topic: string) {
    return subs.get(topic)?.latest as T | undefined
  }

  function advertise(topic: string, type: string) {
    let ad = ads.get(topic)
    if (!ad) {
      ad = { topic, type, id: nextId(`advertise:${topic}`), holders: 0 }
      ads.set(topic, ad)
      if (isOpen()) sendNow({ op: "advertise", id: ad.id, topic, type })
    }
    if (ad.linger) {
      clearTimeout(ad.linger)
      ad.linger = undefined
    }
    ad.holders++
    return ad
  }

  function unadvertise(ad: Advertisement) {
    ad.holders = Math.max(0, ad.holders - 1)
    if (ad.holders > 0 || ad.linger) return
    ad.linger = setTimeout(() => {
      ad.linger = undefined
      if (ad.holders > 0 || ads.get(ad.topic) !== ad) return
      ads.delete(ad.topic)
      if (isOpen()) sendNow({ op: "unadvertise", id: ad.id, topic: ad.topic })
    }, UNADVERTISE_AFTER_MS)
  }

  function publisher<T>(topic: string, type: string, opts: RosPublisherOptions<T> = {}): RosPublisher<T> {
    const stopMessage = (opts.stopMessage === undefined ? defaultStopMessage(type) : opts.stopMessage) as T | null | undefined
    const hasStop = stopMessage !== null && stopMessage !== undefined
    const velocity = opts.stopMessage === undefined && (TWIST.test(type) || TWIST_STAMPED.test(type))
    const isStop = opts.isStop ?? ((m: T) => hasStop && (velocity ? isZeroTwist(m as RosTwist | { twist: RosTwist }) : sameValue(m, stopMessage)))
    let ad: Advertisement | null = null
    // Whether the last message sent was not a stop, and whether non-stop messages are refused until a stop comes.
    let moving = false
    let armed = true

    const send = (message: T, stopping: boolean) => {
      if (!ad) ad = advertise(topic, type)
      // Known to the connection while it has advertised, so a dropped link stops it; release() takes it out.
      if (hasStop) stoppers.add(stop)
      const wire = { op: "publish", id: ad.id, topic, type, msg: message as unknown }
      if (isOpen()) sendNow(wire)
      else if (stopping || !hasStop) hold({ at: now(), message: wire, topic, stop: stopping && hasStop })
      // A velocity command is never held: sent late, it would drive a robot nobody is steering any more.
      else return false
      moving = hasStop && !stopping
      return true
    }

    const stop = (reason: RosStopReason = "app") => {
      if (!hasStop || !moving) return
      if (reason !== "release") armed = false
      send(stopMessage as T, true)
    }

    const self: RosPublisher<T> = {
      topic,
      type,
      publish: (message) => {
        if (!hasStop) return send(message, false)
        const isAStop = isStop(message)
        if (!armed && !isAStop) return false
        armed = true
        if (isAStop) return send(message, true)
        if (!isOpen()) {
          // The link is not there to carry it; whatever the robot last heard is out of our hands, so make sure the first
          // thing it hears when the link returns is a stop, and wait for the app's own stop before driving again.
          if (moving) stop("connection-lost")
          else armed = false
          return false
        }
        return send(message, false)
      },
      stop,
      release: () => {
        stop("release")
        stoppers.delete(stop)
        if (ad) unadvertise(ad)
        ad = null
        moving = false
        armed = true
      },
    }
    return self
  }

  function call<Req, Res>(service: string, request: Req, opts: RosCallOptions = {}): Promise<Res> {
    const { timeoutMs = 10_000, type } = opts
    return new Promise<Res>((resolve, reject) => {
      const id = nextId(`call_service:${service}`)
      const message: Record<string, unknown> = { op: "call_service", id, service, args: request ?? {} }
      if (type) message.type = type
      const timer = setTimeout(() => {
        const i = held.findIndex((h) => h.callId === id)
        if (i >= 0) held.splice(i, 1)
        failCall(id, new RosTimeoutError(service, timeoutMs))
      }, timeoutMs)
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer, sent: false, service })
      if (isOpen()) {
        pending.get(id)!.sent = true
        sendNow(message)
      } else hold({ at: now(), message, callId: id })
    })
  }

  return {
    url,
    connect,
    close,
    reconnectNow,
    getStatus: () => status,
    subscribeStatus: (listener) => {
      statusListeners.add(listener)
      return () => {
        statusListeners.delete(listener)
      }
    },
    subscribe,
    latest,
    publisher,
    call,
  }
}

// --- Messages ------------------------------------------------------------------------------------------------------
// The ROS message shapes the converters read, as rosbridge sends them in JSON (snake_case, as in the .msg files). Only the
// fields used are typed; a message with more passes.

/** ROS 2 writes `sec`/`nanosec`, ROS 1 `secs`/`nsecs`. */
export type RosTime = { sec: number; nanosec: number } | { secs: number; nsecs: number }
export type RosHeader = { stamp?: RosTime; frame_id?: string }
export type RosVector3 = { x: number; y: number; z: number }
export type RosQuaternion = { x: number; y: number; z: number; w: number }
export type RosPose = { position: { x: number; y: number; z?: number }; orientation: RosQuaternion }
export type RosPoseStamped = { header: RosHeader; pose: RosPose }
/** A pose as any of the messages that carry one: Pose, PoseStamped, PoseWithCovariance, PoseWithCovarianceStamped (/amcl_pose) or Odometry. */
export type RosPoseLike = RosPose | { pose: RosPose } | { pose: { pose: RosPose } }
export type RosTwist = { linear: RosVector3; angular: RosVector3 }

/**
 * `sensor_msgs/Imu`. Only the orientation is read; by REP 145 an `orientation_covariance` starting with −1 means the
 * IMU gives no orientation (a gyro and accelerometer alone).
 */
export type RosImu = {
  header?: RosHeader
  orientation: RosQuaternion
  orientation_covariance?: ArrayLike<number>
  angular_velocity?: RosVector3
  linear_acceleration?: RosVector3
}

/** `nav_msgs/Odometry`: the pose in `header.frame_id` and the twist in `child_frame_id` (the robot's base). */
export type RosOdometry = {
  header?: RosHeader
  child_frame_id?: string
  pose: { pose: RosPose }
  twist: { twist: RosTwist }
}

/** `uint8[]` arrives as a base64 string; a client or an older bridge may send a list of numbers. */
export type RosBytes = string | ArrayLike<number>

export type RosOccupancyGrid = {
  header?: RosHeader
  info: { resolution: number; width: number; height: number; origin: RosPose }
  /** `int8[]`: a list of numbers from rosbridge, or base64 from a bridge that encodes it as bytes. */
  data: RosBytes
}

export type RosLaserScan = {
  header?: RosHeader
  angle_min: number
  angle_max?: number
  angle_increment: number
  range_min: number
  range_max: number
  /** NaN and ±Infinity arrive as null, or as bare tokens that `parseRosJson` turns into null. */
  ranges: ArrayLike<number | null>
}

export type RosPointField = { name: string; offset: number; datatype: number; count?: number }
export type RosPointCloud2 = {
  header?: RosHeader
  height: number
  width: number
  fields: RosPointField[]
  is_bigendian: boolean
  point_step: number
  row_step: number
  data: RosBytes
  is_dense?: boolean
}

export type RosJointState = {
  header?: RosHeader
  name: readonly string[]
  position: readonly (number | null)[]
  velocity?: readonly (number | null)[]
  effort?: readonly (number | null)[]
}

/**
 * `diagnostic_msgs/DiagnosticStatus`. `level` is a `byte`: a number from rosbridge for ROS 1, and for ROS 2 a number or,
 * from some bridges, a one-character or base64 string.
 */
export type RosDiagnosticStatus = {
  level: number | string
  name: string
  message?: string
  hardware_id?: string
  values?: readonly { key: string; value: string }[]
}

/** `diagnostic_msgs/DiagnosticArray`, from /diagnostics (each node's own) or /diagnostics_agg (the aggregator's tree). */
export type RosDiagnosticArray = { header?: RosHeader; status: readonly RosDiagnosticStatus[] }

/**
 * A log line from `/rosout`: ROS 2's `rcl_interfaces/msg/Log` (`stamp`, levels 10 to 50) or ROS 1's `rosgraph_msgs/Log`
 * (`header.stamp`, levels 1, 2, 4, 8, 16).
 */
export type RosLog = {
  stamp?: RosTime
  header?: RosHeader
  level: number
  name?: string
  msg: string
  file?: string
  function?: string
  line?: number
  /** ROS 1 only: the topics the node publishes. */
  topics?: readonly string[]
}

/**
 * `sensor_msgs/NavSatFix`, from a GNSS receiver's driver. `status.status` is −1 no fix, 0 a fix, 1 SBAS (differential), 2
 * GBAS (RTK: ublox and NMEA drivers report both RTK fixed and float as 2); ROS 2 Jazzy adds −2, unknown.
 * `position_covariance` is in m², east-north-up, row-major; `position_covariance_type` 0 unknown, 1 approximated (from
 * HDOP), 2 diagonal known, 3 known.
 */
export type RosNavSatFix = {
  header?: RosHeader
  status: { status: number; service?: number }
  latitude: number
  longitude: number
  altitude?: number
  position_covariance?: ArrayLike<number>
  position_covariance_type?: number
}

/** `geographic_msgs/GeoPoint`: WGS 84 degrees, altitude in metres above the ellipsoid. */
export type RosGeoPoint = { latitude: number; longitude: number; altitude?: number }
/** `geographic_msgs/GeoPose` (Nav2's GPS waypoint follower takes a list of them), and a GeoPoseStamped. */
export type RosGeoPose = { position: Required<RosGeoPoint>; orientation: RosQuaternion }
export type RosGeoPoseStamped = { header: RosHeader; pose: RosGeoPose }

// --- Converters ----------------------------------------------------------------------------------------------------
// Pure functions from ROS messages to the props the components take, by the conventions their docs state (robot-map's
// plan coordinates, geo-map's degrees and compass headings, point-cloud's REP 103 frame, joint-state's SI units). The output types are written out here rather
// than imported, so this file installs without the components; tests check they stay assignable to the components' types.

/** Bytes from a base64 string or a list of numbers. */
export function rosBytes(data: RosBytes): Uint8Array {
  if (typeof data !== "string") return data instanceof Uint8Array ? data : Uint8Array.from(data as ArrayLike<number>)
  const text = atob(data)
  const out = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i)
  return out
}

/** A header stamp in ms since the epoch (for `updatedAt`), from ROS 1 or ROS 2 time. */
export function stampToMs(stamp: RosTime | undefined): number | undefined {
  if (!stamp) return undefined
  const s = "sec" in stamp ? stamp.sec : stamp.secs
  const ns = "nanosec" in stamp ? stamp.nanosec : stamp.nsecs
  return Number.isFinite(s) && Number.isFinite(ns) ? s * 1000 + ns / 1e6 : undefined
}

/** Yaw (rotation about z, counter-clockwise from +x) of a quaternion, in radians. */
export function quaternionToYaw(q: RosQuaternion): number {
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
}

/** A quaternion turning `yaw` radians about z. */
export function yawToQuaternion(yaw: number): RosQuaternion {
  return { x: 0, y: 0, z: Math.sin(yaw / 2), w: Math.cos(yaw / 2) }
}

/** The pose inside a Pose, PoseStamped, PoseWithCovariance(Stamped) or Odometry message. */
export function poseOf(message: RosPoseLike): RosPose {
  let m: unknown = message
  // Unwrap `pose` until the object has a position: PoseWithCovarianceStamped nests it twice.
  for (let i = 0; i < 3 && m && typeof m === "object" && !("position" in m) && "pose" in m; i++) m = (m as { pose: unknown }).pose
  return m as RosPose
}

/** The plan in the map frame, as robot-map's `RobotMapFrame` (its `gridToPlan(grid)` gives one for a grid). */
export type RosPlanFrame = { width: number; height: number; origin: { x: number; y: number } }

/** robot-map's `RobotMapPose`: metres from the plan's top-left, y down, heading in degrees clockwise from the top. */
export type RosPlanPose = { x: number; y: number; heading?: number }

/**
 * A pose in the ROS map frame on robot-map's plan, by its documented conversion (the same as its `rosToPlan`):
 * `x = xRos − originX`, `y = height − (yRos − originY)`, `heading = 90 − yaw × 180 / π`, kept in 0–360.
 * The pose must be in the map frame (/amcl_pose is); a pose in `odom` drifts from the map.
 */
export function poseToRobotMapPose(message: RosPoseLike, frame: RosPlanFrame): RosPlanPose {
  const pose = poseOf(message)
  const yaw = quaternionToYaw(pose.orientation)
  return {
    x: pose.position.x - frame.origin.x,
    y: frame.height - (pose.position.y - frame.origin.y),
    heading: (((90 - (yaw * 180) / Math.PI) % 360) + 360) % 360,
  }
}

/**
 * Roll, pitch and yaw of a quaternion, in radians, in the order tf2's `getRPY` uses (yaw about z, then pitch about the new
 * y, then roll about the new x). REP 103, x forward, y left, z up: positive roll lowers the right side, positive pitch
 * lowers the nose, positive yaw turns left (counter-clockwise from above). The quaternion need not be normalised.
 */
export function quaternionToEuler(q: RosQuaternion): { roll: number; pitch: number; yaw: number } {
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1
  const x = q.x / n
  const y = q.y / n
  const z = q.z / n
  const w = q.w / n
  const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y))
  // Clamped: rounding can carry the sine a hair past ±1 at ±90° pitch, where asin would be NaN.
  const pitch = Math.asin(Math.min(1, Math.max(-1, 2 * (w * y - z * x))))
  const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
  return { roll, pitch, yaw }
}

/** attitude's `AttitudeSample`: degrees, REP 103 signs; `heading` clockwise from north, 0–360. */
export type RosAttitude = { roll?: number; pitch?: number; heading?: number }

/**
 * A `sensor_msgs/Imu` as attitude's AttitudeIndicator takes it: roll and pitch in degrees with REP 103's signs (positive
 * roll is the right side down, positive pitch the nose down) and, by default, a compass heading in degrees clockwise from
 * north. The heading assumes the orientation is in an east-north-up frame, as REP 103 and REP 145 have it for an IMU
 * fused with a magnetometer: heading = 90 − yaw. An IMU without one drifts in yaw from where it started; pass
 * `{ heading: false }` and the indicator shows no compass. An IMU that gives no orientation (`orientation_covariance[0]`
 * is −1) or a quaternion that is not finite gives `{}`, which changes nothing when pushed.
 */
export function imuToAttitude(message: RosImu, options: { heading?: boolean } = {}): RosAttitude {
  const q = message.orientation
  if (!q || message.orientation_covariance?.[0] === -1) return {}
  if (![q.x, q.y, q.z, q.w].every(Number.isFinite) || Math.hypot(q.x, q.y, q.z, q.w) === 0) return {}
  const { roll, pitch, yaw } = quaternionToEuler(q)
  const deg = 180 / Math.PI
  const out: RosAttitude = { roll: roll * deg, pitch: pitch * deg }
  if (options.heading !== false) out.heading = (((90 - yaw * deg) % 360) + 360) % 360
  return out
}

/**
 * The robot's speed in m/s from `nav_msgs/Odometry` (or a TwistStamped, or a Twist), for attitude's Gauge: the length of
 * the twist's linear x and y, so a holonomic base moving sideways has a speed too. The twist is in the robot's own frame
 * (`child_frame_id`), as REP 105 has it. `{ signed: true }` gives linear x alone with its sign instead, negative when
 * reversing, for a gauge whose range runs below zero.
 */
export function odometryToSpeed(message: RosOdometry | { twist: RosTwist } | RosTwist, options: { signed?: boolean } = {}): number {
  let t: unknown = message
  // Unwrap `twist` until the object has `linear`: Odometry nests it twice (TwistWithCovariance), TwistStamped once.
  for (let i = 0; i < 3 && t && typeof t === "object" && !("linear" in t) && "twist" in t; i++) t = (t as { twist: unknown }).twist
  const linear = (t as Partial<RosTwist> | undefined)?.linear
  const x = Number(linear?.x ?? 0)
  const y = Number(linear?.y ?? 0)
  if (options.signed) return Number.isFinite(x) ? x : NaN
  const v = Math.hypot(x, y)
  return Number.isFinite(v) ? v : NaN
}

/**
 * A goal placed on robot-map (`onGoal`) as a `geometry_msgs/PoseStamped` in the map frame: the inverse of
 * `poseToRobotMapPose`. Without a heading the goal faces +x. The stamp is left out unless given, and rosbridge for ROS 2
 * fills in the current time; ROS 1 leaves it at zero, which Nav2 and move_base read as "latest".
 */
export function goalToPoseStamped(goal: RosPlanPose, frame: RosPlanFrame, options: { frameId?: string; stamp?: RosTime } = {}): RosPoseStamped {
  const yaw = goal.heading === undefined ? 0 : ((90 - goal.heading) * Math.PI) / 180
  const header: RosHeader = { frame_id: options.frameId ?? "map" }
  if (options.stamp) header.stamp = options.stamp
  return {
    header,
    pose: {
      position: { x: goal.x + frame.origin.x, y: frame.origin.y + frame.height - goal.y, z: 0 },
      orientation: yawToQuaternion(yaw),
    },
  }
}

/** `nav_msgs/Path`: poses in order, each a PoseStamped, under one header. */
export type RosPath = { header: RosHeader; poses: RosPoseStamped[] }

/**
 * The goal of Nav2's `NavigateThroughPoses` action: the poses to drive through, in order, and the behaviour tree to use
 * ("" for the navigator's default). Humble to Jazzy take `poses` as a `geometry_msgs/PoseStamped[]`; Kilted wraps the
 * same list in a `nav_msgs/Goals` (`{ header, goals }`), which `navigateThroughPosesToWaypoints` reads too.
 */
export type RosNavigateThroughPosesGoal = { poses: RosPoseStamped[]; behavior_tree: string }

/** waypoint-editor's `WaypointCoordinate`: metres on robot-map's plan, or latitude and longitude for a geographic map. */
export type RosRouteCoordinate = { kind: "plan"; x: number; y: number } | { kind: "geo"; lat: number; lon: number }

/** waypoint-editor's `Waypoint`, as these converters write it: a name, a place, a heading, and no action yet. */
export type RosRouteWaypoint = { id: string; name: string; at: RosRouteCoordinate; heading?: number; action: { type: "none" }; dwell?: number }

/** The plan degrees (clockwise from the top) from one point to another; 0 when they are the same point. */
const planHeading = (from: { x: number; y: number }, to: { x: number; y: number }) =>
  from.x === to.x && from.y === to.y ? 0 : ((((Math.atan2(to.x - from.x, from.y - to.y) * 180) / Math.PI) % 360) + 360) % 360

/**
 * The route's poses in the map frame, one per waypoint, by `goalToPoseStamped`. A waypoint with no heading faces the next
 * one (the last faces on along the last leg), as a robot driving the route would, unless `faceAlong` is false (then +x).
 * Throws on a `geo` waypoint: latitude and longitude are not in the map frame.
 */
function routePoses(waypoints: readonly { at: RosRouteCoordinate; heading?: number }[], frame: RosPlanFrame, options: { frameId?: string; stamp?: RosTime; faceAlong?: boolean }) {
  const points = waypoints.map((w) => {
    if (w.at.kind !== "plan") throw new Error("A geo waypoint has no place in the map frame: convert it with your map's projection first.")
    return { x: w.at.x, y: w.at.y }
  })
  return waypoints.map((w, i) => {
    const here = points[i]!
    let heading = w.heading
    if (heading === undefined && options.faceAlong !== false && points.length > 1) {
      const next = points[i + 1]
      const prev = points[i - 1]
      heading = next ? planHeading(here, next) : prev ? planHeading(prev, here) : undefined
    }
    return goalToPoseStamped({ ...here, ...(heading === undefined ? {} : { heading }) }, frame, options)
  })
}

/**
 * waypoint-editor's route as a `nav_msgs/Path` in the map frame (`frameId`, "map" by default), for a planner, a
 * follower or a recorded route. Headings as `routePoses` sets them: a waypoint without one faces the next.
 */
export function waypointsToPath(
  waypoints: readonly { at: RosRouteCoordinate; heading?: number }[],
  frame: RosPlanFrame,
  options: { frameId?: string; stamp?: RosTime; faceAlong?: boolean } = {},
): RosPath {
  const header: RosHeader = { frame_id: options.frameId ?? "map" }
  if (options.stamp) header.stamp = options.stamp
  return { header, poses: routePoses(waypoints, frame, options) }
}

/**
 * waypoint-editor's route as the goal of Nav2's `NavigateThroughPoses` (send it to /navigate_through_poses): every
 * waypoint a PoseStamped in the map frame, in order. The actions at each waypoint are the app's to run (Nav2's waypoint
 * follower runs task plugins per pose; NavigateThroughPoses does not stop at them).
 */
export function waypointsToNavigateThroughPoses(
  waypoints: readonly { at: RosRouteCoordinate; heading?: number }[],
  frame: RosPlanFrame,
  options: { frameId?: string; stamp?: RosTime; faceAlong?: boolean; behaviorTree?: string } = {},
): RosNavigateThroughPosesGoal {
  return { poses: routePoses(waypoints, frame, options), behavior_tree: options.behaviorTree ?? "" }
}

/**
 * Poses back as waypoint-editor's waypoints, on the plan: each pose by `poseToRobotMapPose`, named `Waypoint 1`, `2`…
 * (or by `name`), with ids `wp-1`, `wp-2`… (or by `id`) and no action. The poses must be in the map frame.
 */
export function pathToWaypoints(
  message: { poses: readonly RosPoseLike[] },
  frame: RosPlanFrame,
  options: { name?: (index: number) => string; id?: (index: number) => string } = {},
): RosRouteWaypoint[] {
  return message.poses.map((p, i) => {
    const pose = poseToRobotMapPose(p, frame)
    const waypoint: RosRouteWaypoint = {
      id: options.id ? options.id(i) : `wp-${i + 1}`,
      name: options.name ? options.name(i) : `Waypoint ${i + 1}`,
      at: { kind: "plan", x: pose.x, y: pose.y },
      action: { type: "none" },
    }
    if (pose.heading !== undefined) waypoint.heading = pose.heading
    return waypoint
  })
}

/** A `NavigateThroughPoses` goal back as waypoints, as `pathToWaypoints`: `poses` as a list (Humble to Jazzy) or a `nav_msgs/Goals` (Kilted). */
export function navigateThroughPosesToWaypoints(
  goal: { poses: readonly RosPoseLike[] | { goals: readonly RosPoseLike[] } },
  frame: RosPlanFrame,
  options: { name?: (index: number) => string; id?: (index: number) => string } = {},
): RosRouteWaypoint[] {
  const poses = Array.isArray(goal.poses) ? goal.poses : (goal.poses as { goals: readonly RosPoseLike[] }).goals
  return pathToWaypoints({ poses }, frame, options)
}

/** geo-map's `GeoFix`. */
export type RosGeoFix = "rtk-fixed" | "rtk-float" | "dgps" | "gps" | "none"

/** A robot's place for geo-map: `lat`, `lon`, `fix` and `accuracy` are GeoMapRobot's fields; spread it into the robot. */
export type RosGeoPosition = { lat: number; lon: number; fix: RosGeoFix; accuracy?: number; altitude?: number; time?: number }

/**
 * A `sensor_msgs/NavSatFix` as geo-map's robot fields: `lat` and `lon`, the fix in geo-map's words, and `accuracy`, the
 * horizontal accuracy in metres, √(σ²east + σ²north) from the covariance (left out when its type is unknown). The status
 * maps −2 and −1 → "none", 0 → "gps", 1 → "dgps", and 2 → "rtk-fixed" when the accuracy is within `rtkFixedWithin`
 * (default 0.05 m), else "rtk-float": NavSatFix has no field that tells fixed from float, so the covariance decides. A
 * latitude or longitude that is not a number is also "none". `altitude` is passed on, and `time` is the stamp in ms.
 */
export function navSatFixToGeo(message: RosNavSatFix, options: { rtkFixedWithin?: number } = {}): RosGeoPosition {
  const cov = message.position_covariance
  const h = (message.position_covariance_type ?? 0) > 0 && cov ? Math.sqrt((cov[0] ?? NaN) + (cov[4] ?? NaN)) : NaN
  const accuracy = Number.isFinite(h) ? h : undefined
  const status = Number(message.status?.status)
  const valid = Number.isFinite(message.latitude) && Number.isFinite(message.longitude)
  const fix: RosGeoFix =
    !valid || !(status >= 0)
      ? "none"
      : status >= 2
        ? accuracy !== undefined && accuracy <= (options.rtkFixedWithin ?? 0.05)
          ? "rtk-fixed"
          : "rtk-float"
        : status >= 1
          ? "dgps"
          : "gps"
  const out: RosGeoPosition = { lat: message.latitude, lon: message.longitude, fix }
  if (accuracy !== undefined && fix !== "none") out.accuracy = accuracy
  if (typeof message.altitude === "number" && Number.isFinite(message.altitude)) out.altitude = message.altitude
  const time = stampToMs(message.header?.stamp)
  if (time !== undefined) out.time = time
  return out
}

/** The latitude and longitude of a `geographic_msgs/GeoPoint`, or of the GeoPose or GeoPoseStamped around one. */
export function geoPointToGeo(message: RosGeoPoint | { position: RosGeoPoint } | { pose: { position: RosGeoPoint } }): { lat: number; lon: number } {
  const p: RosGeoPoint = "pose" in message ? message.pose.position : "position" in message ? message.position : message
  return { lat: p.latitude, lon: p.longitude }
}

/** A heading clockwise from north in degrees (geo-map's), from a yaw in ENU (REP 103: radians counter-clockwise from east). */
export const enuYawToHeading = (yaw: number) => (((90 - (yaw * 180) / Math.PI) % 360) + 360) % 360

/** A yaw in ENU (radians counter-clockwise from east), from a heading clockwise from north in degrees. */
export const headingToEnuYaw = (heading: number) => ((90 - heading) * Math.PI) / 180

/**
 * A goal placed on geo-map (`onGoal`) as a `geographic_msgs/GeoPoseStamped`: the heading as a yaw in ENU (REP 103), or
 * facing east without one. `altitude` defaults to 0: the message's own "unknown" is NaN, which JSON cannot carry, and a
 * ground robot's planner ignores it. The stamp is left out unless given, as `goalToPoseStamped` does.
 */
export function geoGoalToGeoPoseStamped(
  goal: { lat: number; lon: number; heading?: number },
  options: { frameId?: string; stamp?: RosTime; altitude?: number } = {},
): RosGeoPoseStamped {
  const header: RosHeader = { frame_id: options.frameId ?? "wgs84" }
  if (options.stamp) header.stamp = options.stamp
  return {
    header,
    pose: {
      position: { latitude: goal.lat, longitude: goal.lon, altitude: options.altitude ?? 0 },
      orientation: yawToQuaternion(goal.heading === undefined ? 0 : headingToEnuYaw(goal.heading)),
    },
  }
}

/**
 * A goal placed on geo-map as a `sensor_msgs/NavSatFix`, for waypoint followers that take one: status 0 (a fix), service
 * 1 (GPS) and the covariance unknown (type 0). A NavSatFix has no heading, so the goal's is dropped.
 */
export function geoGoalToNavSatFix(goal: { lat: number; lon: number }, options: { frameId?: string; stamp?: RosTime; altitude?: number } = {}): RosNavSatFix & { header: RosHeader } {
  const header: RosHeader = { frame_id: options.frameId ?? "wgs84" }
  if (options.stamp) header.stamp = options.stamp
  return {
    header,
    status: { status: 0, service: 1 },
    latitude: goal.lat,
    longitude: goal.lon,
    altitude: options.altitude ?? 0,
    position_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    position_covariance_type: 0,
  }
}

/** robot-map's `RobotMapGrid`. */
export type RosMapGrid = { width: number; height: number; resolution: number; origin: { x: number; y: number }; data: Int8Array }

/**
 * A `nav_msgs/OccupancyGrid` as robot-map's `grid` (or `costmap`): row 0 at the bottom, as the message has it; robot-map
 * flips it when it draws. `data` becomes an Int8Array whether it came as numbers or base64. The origin's yaw is dropped:
 * robot-map takes grids with yaw 0, as map_server and the SLAM packages write them.
 * A new array per message: robot-map redraws on a new array, so convert only when a new message arrives.
 */
export function occupancyGridToGrid(message: RosOccupancyGrid): RosMapGrid {
  const { width, height, resolution, origin } = message.info
  const raw = message.data
  let data: Int8Array
  if (typeof raw === "string") {
    const bytes = rosBytes(raw)
    data = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.length)
  } else data = Int8Array.from(raw as ArrayLike<number>)
  return { width, height, resolution, origin: { x: origin.position.x, y: origin.position.y }, data }
}

/** robot-map's `RobotMapScan`. */
export type RosMapScan = { robotId: string; angleMin: number; angleIncrement: number; ranges: Float32Array; rangeMin: number; rangeMax: number }

/**
 * A `sensor_msgs/LaserScan` as one of robot-map's `scans`, drawn from the robot `robotId`. A null range (how JSON carries
 * NaN and ±Infinity) becomes NaN, which robot-map skips with the out-of-range readings. The scan must be in the robot's
 * base frame (the laser at its centre), as robot-map assumes.
 */
export function laserScanToScan(message: RosLaserScan, robotId: string): RosMapScan {
  const { ranges } = message
  const out = new Float32Array(ranges.length)
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i]
    out[i] = typeof r === "number" ? r : NaN
  }
  return { robotId, angleMin: message.angle_min, angleIncrement: message.angle_increment, ranges: out, rangeMin: message.range_min, rangeMax: message.range_max }
}

// sensor_msgs/PointField datatypes.
const POINT_FIELD_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 4, 6: 4, 7: 4, 8: 8 }

function fieldReader(view: DataView, field: RosPointField, little: boolean): (at: number) => number {
  const o = field.offset
  switch (field.datatype) {
    case 1:
      return (at) => view.getInt8(at + o)
    case 2:
      return (at) => view.getUint8(at + o)
    case 3:
      return (at) => view.getInt16(at + o, little)
    case 4:
      return (at) => view.getUint16(at + o, little)
    case 5:
      return (at) => view.getInt32(at + o, little)
    case 6:
      return (at) => view.getUint32(at + o, little)
    case 7:
      return (at) => view.getFloat32(at + o, little)
    case 8:
      return (at) => view.getFloat64(at + o, little)
    default:
      throw new Error(`PointCloud2 field ${field.name} has unknown datatype ${field.datatype}`)
  }
}

/** point-cloud's `points` (x, y, z, metres, REP 103) and, when the cloud has the field, `intensity`, one per point. */
export type RosCloudPoints = { points: Float32Array; intensity?: Float32Array }

/**
 * A `sensor_msgs/PointCloud2` as point-cloud's props. Reads x, y, z and the intensity field (by name, `intensity` unless
 * given) at their offsets, in any of the PointField datatypes, in the message's byte order, row by row (`row_step`) and
 * point by point (`point_step`). Points with a NaN or infinite coordinate are left out whatever `is_dense` says, since
 * drivers do not always set it truly. The points stay in the cloud's own frame (`header.frame_id`).
 */
export function pointCloud2ToPoints(message: RosPointCloud2, options: { intensityField?: string | null } = {}): RosCloudPoints {
  const field = (name: string) => message.fields.find((f) => f.name === name)
  const fx = field("x")
  const fy = field("y")
  const fz = field("z")
  if (!fx || !fy || !fz) throw new Error("PointCloud2 has no x, y and z fields")
  const intensityName = options.intensityField === undefined ? "intensity" : options.intensityField
  const fi = intensityName ? field(intensityName) : undefined
  const bytes = rosBytes(message.data)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const little = !message.is_bigendian
  const rx = fieldReader(view, fx, little)
  const ry = fieldReader(view, fy, little)
  const rz = fieldReader(view, fz, little)
  const ri = fi ? fieldReader(view, fi, little) : null
  // The furthest byte any field reads, so a point cut short at the end of `data` is skipped instead of throwing.
  const span = Math.max(...[fx, fy, fz, fi].map((f) => (f ? f.offset + (POINT_FIELD_SIZE[f.datatype] ?? 8) : 0)))
  const { width, height, point_step: step } = message
  const rowStep = message.row_step || width * step
  const total = width * height
  const points = new Float32Array(total * 3)
  const intensity = ri ? new Float32Array(total) : undefined
  let n = 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const at = row * rowStep + col * step
      if (at + span > bytes.byteLength) break
      const x = rx(at)
      const y = ry(at)
      const z = rz(at)
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue
      points[n * 3] = x
      points[n * 3 + 1] = y
      points[n * 3 + 2] = z
      if (intensity && ri) intensity[n] = ri(at)
      n++
    }
  }
  return { points: points.slice(0, n * 3), ...(intensity ? { intensity: intensity.slice(0, n) } : {}) }
}

/** joint-state's `JointStateJoint`. */
export type RosJoint = {
  name: string
  position: number
  unit?: "rad" | "m"
  lower?: number
  upper?: number
  velocity?: number
  effort?: number
  effortLimit?: number
}

/** What the URDF says about a joint, which the message does not carry. */
export type RosJointLimits = Record<string, { unit?: "rad" | "m"; lower?: number; upper?: number; effortLimit?: number }>

/**
 * A `sensor_msgs/JointState` as joint-state's `joints`, with the URDF's limits added by name. `order` lists and orders the
 * joints to show (the URDF's chain order); without it they come in the message's order. A joint with no finite position is
 * left out. Values stay in SI units, as the panel wants them. For robot-model, use its own `jointStateToRecord`.
 */
export function jointStateToJoints(message: RosJointState, options: { limits?: RosJointLimits; order?: readonly string[] } = {}): RosJoint[] {
  const { limits = {}, order } = options
  const index = new Map(message.name.map((name, i) => [name, i]))
  const finite = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : undefined)
  const out: RosJoint[] = []
  for (const name of order ?? message.name) {
    const i = index.get(name)
    if (i === undefined) continue
    const position = finite(message.position[i])
    if (position === undefined) continue
    const joint: RosJoint = { name, position, ...limits[name] }
    const velocity = finite(message.velocity?.[i])
    const effort = finite(message.effort?.[i])
    if (velocity !== undefined) joint.velocity = velocity
    if (effort !== undefined) joint.effort = effort
    out.push(joint)
  }
  return out
}

/** diagnostics' `DiagnosticStatus`. */
export type RosDiagnostic = {
  name: string
  level: "ok" | "warn" | "error" | "stale"
  message?: string
  hardwareId?: string
  values?: { key: string; value: string }[]
  receivedAt?: number
}

const DIAGNOSTIC_LEVELS = ["ok", "warn", "error", "stale"] as const

/**
 * A DiagnosticStatus `level` byte as a number, however the bridge wrote it: 2, "2", "\u0002", or base64 ("Ag==", how
 * rosbridge for ROS 2 sends a `byte`). NaN when it cannot be read.
 */
function diagnosticLevelByte(level: number | string): number {
  if (typeof level === "number") return level
  if (/^\d+$/.test(level)) return Number(level)
  if (level.length === 1) return level.charCodeAt(0)
  try {
    return rosBytes(level)[0] ?? NaN
  } catch {
    return NaN
  }
}

/**
 * A `diagnostic_msgs/DiagnosticArray` as diagnostics' `statuses`: level 0–3 as "ok", "warn", "error", "stale", and
 * `hardware_id` as `hardwareId`. A level outside 0–3 reads "stale": the robot said something the panel cannot read, so
 * it shows as unknown rather than fine. Each status is stamped `receivedAt` (by default `Date.now()`), so call this when
 * the message arrives, in the subscription's callback, not while rendering.
 */
export function diagnosticArrayToStatuses(message: RosDiagnosticArray, options: { receivedAt?: number } = {}): RosDiagnostic[] {
  const receivedAt = options.receivedAt ?? Date.now()
  return message.status.map((s) => {
    const out: RosDiagnostic = { name: s.name, level: DIAGNOSTIC_LEVELS[diagnosticLevelByte(s.level)] ?? "stale", receivedAt }
    if (s.message) out.message = s.message
    if (s.hardware_id) out.hardwareId = s.hardware_id
    if (s.values?.length) out.values = s.values.map(({ key, value }) => ({ key, value: String(value) }))
    return out
  })
}

/**
 * The latest status of each name, after `incoming` arrives: /diagnostics carries a few statuses per message (each node
 * publishes its own), so the panel needs every name's last one. Names already known keep their place; new ones go last.
 * Returns `previous` itself when `incoming` is empty.
 */
export function mergeDiagnostics<T extends { name: string }>(previous: readonly T[], incoming: readonly T[]): T[] {
  if (incoming.length === 0) return previous as T[]
  const next = new Map(previous.map((s) => [s.name, s]))
  for (const s of incoming) next.set(s.name, s)
  return [...next.values()]
}

/** log-viewer's `LogLine`. */
export type RosLogLine = {
  id?: string | number
  time: number
  level: "debug" | "info" | "warn" | "error" | "fatal"
  source?: string
  message: string
  file?: string
  function?: string
  line?: number
  fields?: Record<string, string | number | boolean>
}

/**
 * A `/rosout` message (ROS 2 `rcl_interfaces/msg/Log` or ROS 1 `rosgraph_msgs/Log`) as log-viewer's `LogLine`: the stamp in
 * ms since the epoch (`receivedAt`, default now, when it has none), the level as a word, the node's name as the source,
 * and the file, function and line it was written from. The two versions' level numbers do not overlap (ROS 2: 10, 20,
 * 30, 40, 50; ROS 1: 1, 2, 4, 8, 16), so one function reads both; a number in between takes the level below it.
 */
export function rosLogToLogLine(message: RosLog, options: { receivedAt?: number } = {}): RosLogLine {
  const n = Number(message.level)
  const ros1 = n === 1 || n === 2 || n === 4 || n === 8 || n === 16
  const level: RosLogLine["level"] = ros1
    ? n >= 16 ? "fatal" : n >= 8 ? "error" : n >= 4 ? "warn" : n >= 2 ? "info" : "debug"
    : n >= 50 ? "fatal" : n >= 40 ? "error" : n >= 30 ? "warn" : n >= 20 ? "info" : "debug"
  const time = stampToMs(message.stamp ?? message.header?.stamp) ?? options.receivedAt ?? Date.now()
  const line: RosLogLine = { time, level, message: String(message.msg ?? "") }
  if (message.name) line.source = message.name
  if (message.file) line.file = message.file
  if (message.function) line.function = message.function
  if (typeof message.line === "number" && message.line > 0) line.line = message.line
  if (message.topics?.length) line.fields = { topics: message.topics.join(", ") }
  return line
}

// --- Detections: vision_msgs on a picture ------------------------------------------------------------------------

/** A `vision_msgs/Detection2D`: ROS 2 (Humble on: `center.position`, `hypothesis.class_id`) or older (`center.x`, `id`). */
export type RosDetection2D = {
  id?: string
  results?: readonly { hypothesis?: { class_id: string; score: number }; id?: string | number; score?: number }[]
  bbox: { center: { position?: { x: number; y: number }; x?: number; y?: number; theta?: number }; size_x: number; size_y: number }
}
export type RosDetection2DArray = { header?: RosHeader; detections: readonly RosDetection2D[] }

/** annotated-image's `Annotation` for a box (and the marks grounded-text's spans point at). */
export type RosAnnotation = {
  id: string
  kind: "predicted" | "truth" | "previous"
  label: string
  score?: number
  shape: { type: "box"; x: number; y: number; width: number; height: number }
}

/**
 * A `vision_msgs/Detection2DArray` as annotated-image's `annotations` (and the marks grounded-text's spans point at): each
 * detection a box in the image's pixels, labelled with its best hypothesis's class (through `classes` when the ids are
 * numbers or codes) and score. The id is the detection's own `id` when it has one, else `${prefix}${index}`. A rotated box
 * (`theta`) is drawn upright.
 */
export function detection2DArrayToAnnotations(
  message: RosDetection2DArray,
  options: { kind?: RosAnnotation["kind"]; classes?: Record<string, string>; prefix?: string } = {},
): RosAnnotation[] {
  const { kind = "predicted", classes, prefix = "d" } = options
  return message.detections.map((d, i) => {
    const best = [...(d.results ?? [])]
      .map((r) => ({ cls: String(r.hypothesis?.class_id ?? r.id ?? ""), score: r.hypothesis?.score ?? r.score }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
    const cx = d.bbox.center.position?.x ?? d.bbox.center.x ?? 0
    const cy = d.bbox.center.position?.y ?? d.bbox.center.y ?? 0
    const a: RosAnnotation = {
      id: d.id || `${prefix}${i}`,
      kind,
      label: best ? (classes?.[best.cls] ?? best.cls) : "",
      shape: { type: "box", x: cx - d.bbox.size_x / 2, y: cy - d.bbox.size_y / 2, width: d.bbox.size_x, height: d.bbox.size_y },
    }
    if (best?.score !== undefined) a.score = best.score
    return a
  })
}

// --- Video: image topics through web_video_server --------------------------------------------------------------------

/** The size and bitrate web_video_server encodes at, for camera-wall's `quality` hint. */
export const webVideoQuality = {
  low: { width: 640, height: 360, bitrate: 300_000 },
  high: { width: 1280, height: 720, bitrate: 2_000_000 },
} as const

/**
 * The URL a `<video>` plays for a `sensor_msgs/Image` topic, through web_video_server on the robot
 * (`ros2 run web_video_server web_video_server`, port 8080): a camera-feed `src`, or what camera-wall's source function
 * returns for a camera and its `quality` ("low" for a tile, "high" for the focused camera). Images never go over rosbridge:
 * a JSON frame per image is far too slow. `type` is the encoding: "vp8" (WebM, plays everywhere but Safari) by default,
 * "h264" (MP4) for Safari. MJPEG is not a video a `<video>` plays. For WebRTC (webrtc_ros, a media gateway) the app owns
 * the connection and passes the MediaStream instead.
 */
export function webVideoServerSrc(
  server: string,
  topic: string,
  options: { quality?: keyof typeof webVideoQuality; type?: "vp8" | "vp9" | "h264"; width?: number; height?: number; bitrate?: number; transport?: "raw" | "compressed" } = {},
): string {
  const preset = webVideoQuality[options.quality ?? "low"]
  const params = new URLSearchParams({
    topic,
    type: options.type ?? "vp8",
    width: String(options.width ?? preset.width),
    height: String(options.height ?? preset.height),
    bitrate: String(options.bitrate ?? preset.bitrate),
  })
  if (options.transport) params.set("default_transport", options.transport)
  return `${server.replace(/\/+$/, "")}/stream?${params}`
}

/** A `geometry_msgs/Twist` with every component 0: stop. */
export const zeroTwist = (): RosTwist => ({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } })

/** Whether a Twist (or a TwistStamped's `twist`) stops: every component 0 or left out, as rosbridge fills missing fields with 0. */
export function isZeroTwist(message: Partial<RosTwist> | { twist: Partial<RosTwist> }): boolean {
  if (!message || typeof message !== "object") return false
  const t: Partial<RosTwist> = "twist" in message ? message.twist : message
  const zero = (v: Partial<RosVector3> | undefined) => !v || ((v.x ?? 0) === 0 && (v.y ?? 0) === 0 && (v.z ?? 0) === 0)
  return zero(t.linear) && zero(t.angular)
}

const clamp1 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(-1, v)) : 0)

/**
 * teleop-pad's command (`{ linear, angular }`, each −1…1 of top speed, REP 103: forward and left are +) as a
 * `geometry_msgs/Twist` for a differential or skid-steer base: `linear.x = linear × maxLinear` (m/s),
 * `angular.z = angular × maxAngular` (rad/s). Out-of-range or non-finite values are clamped first. Clamp again on the robot.
 */
export function teleopToTwist(command: { linear: number; angular: number }, limits: { maxLinear: number; maxAngular: number }): RosTwist {
  // `|| 0` turns −0 into 0, so a stop is exactly the zero Twist.
  return {
    linear: { x: clamp1(command.linear) * limits.maxLinear || 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: clamp1(command.angular) * limits.maxAngular || 0 },
  }
}
