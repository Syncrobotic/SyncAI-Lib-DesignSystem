"use client"

import { feedback, haptics, type FeedbackName } from "@/registry/syncrobotic/lib/feedback"
import { Button } from "@/registry/syncrobotic/ui/button"

/** Each moment's pattern, to feel and hear on a real device. The first tap also unlocks sound. */
export function FeedbackDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(haptics) as FeedbackName[]).map((name) => (
          <Button key={name} variant="secondary" size="sm" onClick={() => feedback(name)} className="font-mono text-xs">
            {name}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Try these on an Android phone: iOS Safari does not vibrate, and sound plays only for the two alarms.
      </p>
    </div>
  )
}
