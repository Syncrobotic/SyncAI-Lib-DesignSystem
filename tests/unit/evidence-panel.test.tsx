import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { EvidencePanel, compareEvidence, type EvidenceRow } from "@/registry/syncrobotic/ui/evidence-panel"

afterEach(cleanup)

const rows: EvidenceRow[] = [
  { id: "name", label: "Name it gives", reported: "lm-hsinchu-01" },
  { id: "gpus", label: "GPU UUIDs", reported: ["GPU-b", "GPU-x"], expected: ["GPU-a", "GPU-b"], mono: true },
  { id: "product", label: "Product UUID", reported: "4c4c-1", expected: "4c4c-1", mono: true },
  { id: "version", label: "Software version", reported: null, expected: "2.4.1" },
  { id: "key", label: "Key fingerprint", reported: "SHA256:abc", copy: true },
]

describe("compareEvidence", () => {
  it("no expectation is unchecked, never a match", () => {
    expect(compareEvidence({ reported: "x" })).toBe("unchecked")
    expect(compareEvidence({ reported: "x", expected: null })).toBe("unchecked")
    expect(compareEvidence({ reported: "x", expected: [] })).toBe("unchecked")
  })

  it("nothing reported against an expectation is missing", () => {
    expect(compareEvidence({ reported: null, expected: "2.4.1" })).toBe("missing")
    expect(compareEvidence({ reported: "  ", expected: "2.4.1" })).toBe("missing")
    expect(compareEvidence({ reported: [], expected: ["a"] })).toBe("missing")
  })

  it("lists compare as sets, in any order; strings exactly, trimmed", () => {
    expect(compareEvidence({ reported: ["b", "a"], expected: ["a", "b"] })).toBe("match")
    expect(compareEvidence({ reported: ["a"], expected: ["a", "b"] })).toBe("mismatch")
    expect(compareEvidence({ reported: " 2.4.1 ", expected: "2.4.1" })).toBe("match")
    expect(compareEvidence({ reported: "ABC", expected: "abc" })).toBe("mismatch")
  })

  it("takes the product's own comparison", () => {
    const ci = (a: string[], b: string[]) => a.join().toLowerCase() === b.join().toLowerCase()
    expect(compareEvidence({ reported: "ABC", expected: "abc", matches: ci })).toBe("match")
  })
})

describe("EvidencePanel", () => {
  it("is headed by its source and says it is unverified", () => {
    render(<EvidencePanel rows={rows} />)
    const panel = screen.getByRole("region", { name: "Reported by the device" })
    expect(within(panel).getByText(/Unverified: the device sent this about itself/)).toBeTruthy()
  })

  it("marks each row and says what differs first", () => {
    render(<EvidencePanel rows={rows} />)
    const verdict = (id: string) => document.querySelector<HTMLElement>(`[data-verdict]:nth-child(${rows.findIndex((r) => r.id === id) + 1})`)!.dataset.verdict
    expect(verdict("gpus")).toBe("mismatch")
    expect(verdict("product")).toBe("match")
    expect(verdict("version")).toBe("missing")
    expect(verdict("name")).toBe("unchecked")
    expect(screen.getByText("1 value does not match the record, 1 not reported")).toBeTruthy()
    expect(screen.getByText("Does not match").closest("[role=cell]")!.className).toContain("text-danger")
    expect(screen.getAllByText("Not reported").length).toBeGreaterThan(0)
  })

  it("is a table to screen readers, with a column for the device and one for the record", () => {
    render(<EvidencePanel rows={rows} />)
    const table = screen.getByRole("table")
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Field", "Device says", "On record", "Check"])
    expect(within(table).getAllByRole("row")).toHaveLength(rows.length + 1)
  })

  it("with nothing on record: no comparison columns and no summary", () => {
    render(<EvidencePanel rows={rows.map(({ expected: _, ...r }) => r)} />)
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Field", "Device says"])
    expect(document.querySelector("[data-slot=evidence-panel-summary]")).toBeNull()
  })

  it("all on record match: the summary is grey", () => {
    render(<EvidencePanel rows={[rows[2]!]} />)
    const summary = document.querySelector("[data-slot=evidence-panel-summary]")!
    expect(summary.textContent).toBe("Every value on record matches")
    expect(summary.className).toContain("text-muted-foreground")
  })

  it("a copy button named for its field", () => {
    render(<EvidencePanel rows={rows} />)
    expect(screen.getByRole("button", { name: "Copy Key fingerprint" })).toBeTruthy()
  })
})
