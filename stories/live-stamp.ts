import * as React from "react"

/**
 * A stamp that moves every 200 ms, as a robot re-publishing the same reading does. Live-telemetry components go stale by
 * default when nothing new arrives; a story that shows a fixed reading passes this as the reading's time (`updatedAt`,
 * `receivedAt`) so it stays live, exactly as a still robot that keeps publishing does. The stamp is shown only once a
 * view is stale, so every screenshot is the same.
 */
export function useLiveStamp(everyMs = 200) {
  const [stamp, setStamp] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = setInterval(() => setStamp(Date.now()), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return stamp
}
