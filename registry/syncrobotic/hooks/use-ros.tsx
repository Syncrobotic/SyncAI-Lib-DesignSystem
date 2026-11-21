// @syncrobotic/use-ros v0.27.0 · update: npx shadcn add @syncrobotic/use-ros --overwrite
"use client"

import * as React from "react"
import {
  createRosConnection,
  type RosConnection,
  type RosHeartbeat,
  type RosPublisherOptions,
  type RosReconnect,
  type RosStatus,
} from "@/registry/syncrobotic/lib/ros"

// The React layer over `ros`: one connection in context, and hooks that read it through useSyncExternalStore. Nothing
// here reads a ref during render or sets state in an effect, so the React Compiler keeps every hook as written.

const RosContext = React.createContext<RosConnection | null>(null)

export type RosProviderProps = {
  children?: React.ReactNode
} & (
  | {
      /** The rosbridge server: `ws://robot.local:9090`. The provider opens the connection on mount and closes it on unmount; a new url is a new connection. */
      url: string
      /** Read when the connection is created. Default `true`. */
      reconnect?: boolean | RosReconnect
      /** Read when the connection is created. Off by default; `true` calls `/rosapi/get_time` every 5 s. */
      heartbeat?: boolean | RosHeartbeat
      connection?: never
    }
  | {
      /** A connection the app made with `createRosConnection` and opens and closes itself (one shared across routes, or a test's). */
      connection: RosConnection
      url?: never
      reconnect?: never
      heartbeat?: never
    }
)

/** Gives the hooks below one rosbridge connection. */
export function RosProvider({ children, url, connection, reconnect, heartbeat }: RosProviderProps) {
  const [owned, setOwned] = React.useState(() => (connection || url === undefined ? null : createRosConnection({ url, reconnect, heartbeat })))
  // A new url is a new connection, made in the render that brings it. Creating one opens nothing; the effect below does.
  if (!connection && url !== undefined && owned?.url !== url) setOwned(createRosConnection({ url, reconnect, heartbeat }))
  React.useEffect(() => {
    if (connection || !owned) return
    owned.connect()
    return () => owned.close()
  }, [owned, connection])
  return <RosContext.Provider value={connection ?? owned}>{children}</RosContext.Provider>
}

/** The provider's connection, for what the hooks do not cover. Throws outside a RosProvider. */
export function useRosConnection(): RosConnection {
  const connection = React.useContext(RosContext)
  if (!connection) throw new Error("useRos… hooks need a <RosProvider> above them")
  return connection
}

const closed: RosStatus = { state: "closed", attempt: 0 }
const serverStatus = () => closed

/** The connection's state, its last error, the attempt count and, with a heartbeat, the latency. */
export function useRosStatus(): RosStatus {
  const connection = useRosConnection()
  return React.useSyncExternalStore(connection.subscribeStatus, connection.getStatus, serverStatus)
}

export type UseRosTopicOptions = {
  /** At most one message per this many ms, throttled by rosbridge before it is sent (`throttle_rate`). */
  throttleMs?: number
  /** Messages rosbridge may hold while throttling (`queue_length`). */
  queueLength?: number
  /** `false` unsubscribes and returns undefined. Default true. */
  enabled?: boolean
}

const nothing = () => undefined
const noop = () => {}

/**
 * The latest message on a topic, or undefined until one arrives. Every component asking for the same topic shares one
 * subscription and sees the same message object; a new object means a new message, so convert it in a useMemo keyed on it.
 */
export function useRosTopic<T = unknown>(name: string, type: string, options: UseRosTopicOptions = {}): T | undefined {
  const { throttleMs, queueLength, enabled = true } = options
  const connection = useRosConnection()
  // Stable while the topic and its options are, so React does not resubscribe on every render.
  const subscribe = React.useCallback(
    (notify: () => void) => (enabled ? connection.subscribe(name, type, notify, { throttleMs, queueLength }) : noop),
    [connection, name, type, throttleMs, queueLength, enabled],
  )
  const snapshot = React.useCallback(() => (enabled ? connection.latest<T>(name) : undefined), [connection, name, enabled])
  return React.useSyncExternalStore(subscribe, snapshot, nothing)
}

/**
 * A function that publishes on a topic, the same function for as long as the topic, type and connection are. The topic is
 * advertised on the first publish and unadvertised after unmount. It returns false when the message was dropped.
 *
 * For `geometry_msgs/Twist` and `TwistStamped` (a robot's `cmd_vel`) it also sends a zero Twist when it unmounts, when the
 * page is hidden and when the connection drops, if the last command was not already a stop, and after the page hid or the
 * link dropped it ignores drive commands until the app publishes a stop (the operator lets go and presses again).
 * `stopMessage` gives another type a stop, or (`null`) turns this off.
 */
export function useRosPublisher<T = unknown>(name: string, type: string, options?: RosPublisherOptions<T>): (message: T) => boolean {
  const connection = useRosConnection()
  const [publisher, setPublisher] = React.useState(() => ({ connection, it: connection.publisher<T>(name, type, options) }))
  // A new topic, type or connection is a new publisher, made in this render; the effect below releases the old one.
  if (publisher.connection !== connection || publisher.it.topic !== name || publisher.it.type !== type)
    setPublisher({ connection, it: connection.publisher<T>(name, type, options) })
  const it = publisher.it
  React.useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "hidden") it.stop("hidden")
    }
    const leave = () => it.stop("hidden")
    document.addEventListener("visibilitychange", hide)
    window.addEventListener("pagehide", leave)
    return () => {
      document.removeEventListener("visibilitychange", hide)
      window.removeEventListener("pagehide", leave)
      it.release()
    }
  }, [it])
  return it.publish
}

export type UseRosServiceOptions = {
  /** Reject after this many ms. Default 10 000. */
  timeoutMs?: number
}

/** A function that calls a service and resolves with its response, or rejects with RosServiceError, RosTimeoutError or RosConnectionError. */
export function useRosService<Req = unknown, Res = unknown>(name: string, type?: string, options: UseRosServiceOptions = {}): (request: Req) => Promise<Res> {
  const { timeoutMs } = options
  const connection = useRosConnection()
  return React.useCallback((request: Req) => connection.call<Req, Res>(name, request, { type, timeoutMs }), [connection, name, type, timeoutMs])
}
