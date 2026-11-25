import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, describe, vi } from "vitest"
import { configureFeedback } from "@/registry/syncrobotic/lib/feedback"
import { useSlideRelease } from "@/registry/syncrobotic/hooks/use-slide-release"
import { slideReleaseScenarios } from "./hold-scenarios"

// Slide to release the e-stop, on the source as written. The same scenarios run compiled in use-slide-release.compiler.test.tsx.

beforeEach(() => {
  vi.useFakeTimers()
  configureFeedback({ haptics: false, sound: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  configureFeedback({ haptics: true, sound: true })
})

describe("useSlideRelease", () => slideReleaseScenarios(useSlideRelease))
