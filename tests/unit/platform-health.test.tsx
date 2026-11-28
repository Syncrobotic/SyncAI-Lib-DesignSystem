import * as React from "react"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PlatformHealthContent,
  jobStatus,
  queueStatus,
  samplePlatformDatabase,
  samplePlatformEmail,
  samplePlatformJobs,
  samplePlatformQueues,
  samplePlatformThresholds,
  samplePlatformWorkers,
  workerStatus,
  type PlatformQueue,
} from "@/registry/syncrobotic/blocks/platform-health"
import { StepUpCancelledError } from "@/registry/syncrobotic/hooks/use-step-up"
import { platformHealthLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"

afterEach(cleanup)

const NOW = Date.parse("2026-11-27T06:00:00Z")
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const flush = () => act(async () => {})
const sectionOf = (id: string) => document.querySelector<HTMLElement>(`[data-slot="platform-health-${id}"]`)!
const apiError = (code: string) => Object.assign(new Error("server words, never shown"), { error: { code } })

const healthy = {
  workers: [{ id: "w1", name: "worker-1", alive: true, lastHeartbeatAt: ago(5_000) }],
  queues: [{ name: "send-email", depth: 4, failed: 0, oldestJobAt: ago(60_000) }],
  jobs: [{ name: "cleanup", schedule: "Every hour", lastRunAt: ago(600_000), lastResult: "succeeded" as const }],
  email: { sent: 120, bounced: 1, failed: 0 },
  database: { storage: { usedBytes: 100e9, capacityBytes: 500e9 }, replicas: [{ name: "replica-1", lagMs: 200 }] },
}

const health = (props: Partial<React.ComponentProps<typeof PlatformHealthContent>> = {}) =>
  render(<PlatformHealthContent {...healthy} thresholds={samplePlatformThresholds} now={NOW} {...props} />)

const coloured = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>("[data-slot='platform-health-status'], [data-slot='freshness-stamp']")].filter((e) => /text-(danger|warning)/.test(e.className))

describe("PlatformHealthContent", () => {
  it("draws a healthy platform in grey: no status is coloured", () => {
    const { container } = health()
    expect(coloured(container)).toHaveLength(0)
    expect(screen.getByText("All alive")).toBeTruthy()
    expect(screen.getByText("None failed")).toBeTruthy()
    expect(screen.getByText("All on time")).toBeTruthy()
  })

  it("colours only the problems, each with a shape and words", () => {
    const { container } = health({
      workers: samplePlatformWorkers,
      queues: samplePlatformQueues,
      jobs: samplePlatformJobs,
      email: samplePlatformEmail,
      database: samplePlatformDatabase,
    })
    const marks = coloured(container).map((e) => e.textContent)
    // A worker down, failed jobs, a stuck queue, a failed and an overdue run, failed email, storage nearly full, a replica behind.
    for (const text of ["Down", "3 failed", "Stuck: oldest waiting 22 min", "Failed", "Overdue", "2", "Nearly full", "replica-2: 18 sec behind"]) expect(marks).toContain(text)
    // Paused is someone's choice; a table waiting for its migration is expected.
    const paused = screen.getAllByText("Paused")[0]!.closest<HTMLElement>("[data-slot='platform-health-status']")!
    expect(paused.className).toContain("text-muted-foreground")
    expect(screen.getByText("Not partitioned yet")).toBeTruthy()
    for (const e of coloured(container)) expect(e.querySelector("svg")).toBeTruthy()
  })

  it("takes every limit from the server: without one, no verdict", () => {
    const stuck: PlatformQueue = { name: "q", depth: 5, failed: 0, oldestJobAt: ago(3_600_000) }
    expect(queueStatus(stuck, 15 * 60_000, NOW)).toBe("stuck")
    expect(queueStatus(stuck, undefined, NOW)).toBe("healthy")
    expect(queueStatus({ ...stuck, depth: 0 }, 15 * 60_000, NOW)).toBe("healthy")
    expect(queueStatus({ ...stuck, paused: true }, undefined, NOW)).toBe("paused")
    expect(queueStatus({ ...stuck, failed: 1 }, undefined, NOW)).toBe("failed")
    const w = { id: "w", name: "w", alive: true, lastHeartbeatAt: ago(60_000) }
    expect(workerStatus(w, { laggingAfterMs: 30_000, staleAfterMs: 120_000 }, NOW)).toBe("late")
    expect(workerStatus(w, { laggingAfterMs: 30_000, staleAfterMs: 50_000 }, NOW)).toBe("down")
    expect(workerStatus({ ...w, alive: false, lastHeartbeatAt: ago(1_000) }, { laggingAfterMs: 30_000 }, NOW)).toBe("down")
    // Overdue is the server's verdict, never worked out from the schedule's words.
    expect(jobStatus({ name: "j", schedule: "Every minute", lastRunAt: ago(86_400_000), lastResult: "succeeded" })).toBe("ok")
    expect(jobStatus({ name: "j", schedule: "Every minute", lastRunAt: ago(1_000), lastResult: "succeeded", overdue: true })).toBe("overdue")
    expect(jobStatus({ name: "j", schedule: "Daily", lastRunAt: null })).toBe("never")
  })

  it("adds up the server's counts for the summary", () => {
    health({ queues: samplePlatformQueues, workers: samplePlatformWorkers })
    const summary = screen.getByRole("region", { name: "Summary" })
    expect(within(summary).getByText("2 of 3")).toBeTruthy()
    expect(within(summary).getByText("1 worker down")).toBeTruthy()
    expect(within(summary).getByText("432")).toBeTruthy()
    expect(within(summary).getByText("3 failed")).toBeTruthy()
  })

  it("loads each section on its own: a failure shows its code there and the rest stays readable", () => {
    const onRetry = vi.fn()
    health({ states: { queues: { state: "error", error: { code: "QUEUE_UNREACHABLE" } }, database: { state: "loading" } }, onRetry })
    const queues = sectionOf("queues")
    expect(within(queues).getByText(/QUEUE_UNREACHABLE/)).toBeTruthy()
    expect(within(queues).queryByRole("table")).toBeNull()
    fireEvent.click(within(queues).getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledWith("queues")
    expect(within(sectionOf("workers")).getByRole("table")).toBeTruthy()
    // The summary does not make up a number for a section that did not load.
    expect(within(screen.getByRole("region", { name: "Summary" })).queryByText("4")).toBeNull()
  })

  it("disables the queue's actions for a viewer without the permission, with the reason", async () => {
    const onRetryFailed = vi.fn(() => Promise.resolve())
    health({ queues: samplePlatformQueues, onRetryFailed, onPauseQueue: () => Promise.resolve(), can: permissionsFrom(["system:read"]) })
    fireEvent.keyDown(screen.getByRole("button", { name: "Actions for dispatch-webhook" }), { key: "Enter" })
    const retry = await screen.findByRole("menuitem", { name: "Retry failed jobs" })
    expect(retry.getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText("You need the system:write permission.").length).toBeGreaterThan(0)
    fireEvent.click(retry)
    expect(onRetryFailed).not.toHaveBeenCalled()
  })

  it("retries failed jobs through the promise, and says what happened", async () => {
    const onRetryFailed = vi.fn().mockRejectedValueOnce(apiError("QUEUE_LOCKED")).mockResolvedValueOnce(undefined)
    health({ queues: samplePlatformQueues, onRetryFailed, labels: { errors: { QUEUE_LOCKED: "Another retry is running." } } })
    fireEvent.keyDown(screen.getByRole("button", { name: "Actions for dispatch-webhook" }), { key: "Enter" })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Retry failed jobs" }))
    await flush()
    expect(onRetryFailed).toHaveBeenCalledWith(expect.objectContaining({ name: "dispatch-webhook" }))
    expect(screen.getByRole("alert").textContent).toBe("Another retry is running.")
    cleanup()
    health({ queues: samplePlatformQueues, onRetryFailed })
    fireEvent.keyDown(screen.getByRole("button", { name: "Actions for dispatch-webhook" }), { key: "Enter" })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Retry failed jobs" }))
    await flush()
    expect(onRetryFailed).toHaveBeenCalledTimes(2)
    expect(screen.getByText("Failed jobs in dispatch-webhook are queued again.").getAttribute("role")).toBe("status")
  })

  it("asks before pausing a queue; a cancelled step-up keeps the dialog and says nothing", async () => {
    const onPauseQueue = vi.fn().mockRejectedValueOnce(new StepUpCancelledError()).mockResolvedValueOnce(undefined)
    health({ queues: samplePlatformQueues, onPauseQueue })
    fireEvent.keyDown(screen.getByRole("button", { name: "Actions for send-email" }), { key: "Enter" })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Pause queue…" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Pause send-email?")).toBeTruthy()
    fireEvent.click(within(dialog).getByRole("button", { name: "Pause queue" }))
    await flush()
    expect(onPauseQueue).toHaveBeenCalledWith(expect.objectContaining({ name: "send-email" }), true)
    expect(screen.getByRole("alertdialog")).toBeTruthy()
    expect(screen.queryByRole("alert")).toBeNull()
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Pause queue" }))
    await flush()
    expect(screen.queryByRole("alertdialog")).toBeNull()
    // A paused queue resumes at once: nothing to confirm.
    fireEvent.keyDown(screen.getByRole("button", { name: "Actions for audit-export" }), { key: "Enter" })
    fireEvent.click(await screen.findByRole("menuitem", { name: "Resume queue" }))
    await flush()
    expect(onPauseQueue).toHaveBeenLastCalledWith(expect.objectContaining({ name: "audit-export" }), false)
  })

  it("speaks Traditional Chinese with the zh-TW labels", () => {
    health({ workers: samplePlatformWorkers, labels: platformHealthLabels, locale: "zh-TW" })
    expect(screen.getByRole("heading", { name: "工作程序" })).toBeTruthy()
    expect(screen.getAllByText("停止").length).toBeGreaterThan(0)
  })
})
