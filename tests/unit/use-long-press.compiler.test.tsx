import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { useLongPress } from "@/registry/syncrobotic/hooks/use-long-press?react-compiler"
import { longPressScenarios } from "./hold-scenarios"

// Products build with the React Compiler. vitest.config.ts compiles this file and the hook imported with ?react-compiler,
// so the e-stop's press-and-hold is checked as a product ships it: the same scenarios as use-long-press.test.tsx.

beforeEach(() => {
  vi.useFakeTimers()
  configureFeedback({ haptics: false, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  configureFeedback({ haptics: true, sound: true })
})

describe("useLongPress, compiled", () => longPressScenarios(useLongPress))
