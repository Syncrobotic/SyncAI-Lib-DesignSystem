import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { useLongPress } from "@/registry/syncrobotic/hooks/use-long-press"
import { longPressScenarios } from "./hold-scenarios"

// The e-stop's press-and-hold, on the source as written. The same scenarios run compiled in use-long-press.compiler.test.tsx.

beforeEach(() => {
  vi.useFakeTimers()
  configureFeedback({ haptics: false, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  configureFeedback({ haptics: true, sound: true })
})

describe("useLongPress", () => longPressScenarios(useLongPress))
