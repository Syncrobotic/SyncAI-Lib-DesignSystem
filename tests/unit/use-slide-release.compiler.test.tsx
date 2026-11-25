import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { useSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release?react-compiler"
import { slideReleaseScenarios } from "./hold-scenarios"

// Products build with the React Compiler. vitest.config.ts compiles this file and the hook imported with ?react-compiler,
// so slide to release is checked as a product ships it: the same scenarios as use-slide-release.test.tsx.

beforeEach(() => {
  vi.useFakeTimers()
  configureFeedback({ haptics: false, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  configureFeedback({ haptics: true, sound: true })
})

describe("useSlideRelease, compiled", () => slideReleaseScenarios(useSlideRelease))
