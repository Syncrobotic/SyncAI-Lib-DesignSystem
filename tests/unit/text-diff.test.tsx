import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { TextDiff, diffStats, diffWords, tokenize } from "@/registry/syncrobotic/ui/text-diff"

afterEach(cleanup)

const join = (parts: { text: string }[]) => parts.map((p) => p.text).join("")
const side = (parts: ReturnType<typeof diffWords>, keep: "added" | "removed") => join(parts.filter((p) => p.type === "same" || p.type === keep))

describe("tokenize", () => {
  it("splits on spaces, keeps the spacing after each word, and gives back the original", () => {
    const t = tokenize("  A forklift\n carries  two pallets.")
    expect(t.map((x) => x.word)).toEqual(["A", "forklift", "carries", "two", "pallets."])
    expect(t.map((x) => x.text).join("")).toBe("  A forklift\n carries  two pallets.")
  })
  it("makes each Chinese or Japanese character a word", () => {
    expect(tokenize("一台堆高機 moves").map((x) => x.word)).toEqual(["一", "台", "堆", "高", "機", "moves"])
  })
  it("has no tokens in an empty text, and one wordless token for spacing alone", () => {
    expect(tokenize("")).toEqual([])
    expect(tokenize("   ")).toEqual([{ word: "", text: "   " }])
    expect(tokenize(" \n\t")).toEqual([{ word: "", text: " \n\t" }])
  })
  it("gives back exactly the input for many generated texts", () => {
    // A small seeded generator (mulberry32), so a failure names a string that can be reproduced.
    let seed = 0x5eed
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    // Latin words, punctuation, CJK and full-width forms, emoji (surrogate pairs) and every kind of spacing, including
    // the ideographic space and no-break space.
    const alphabet = ["a", "Z", "9", ".", ",", "-", "é", "一", "台", "機", "の", "カ", "！", "（", "😀", "𠀋", " ", "  ", "\n", "\t", "\r\n", "\u3000", "\u00a0"]
    const pick = () => alphabet[Math.floor(random() * alphabet.length)]!
    const fixed = ["", " ", "  ", "\n", " a", "a ", "  a  b  ", "\u3000一台\u3000", " 一 ", "a\n\n"]
    const generated = Array.from({ length: 2000 }, () => Array.from({ length: Math.floor(random() * 12) }, pick).join(""))
    for (const input of [...fixed, ...generated]) {
      const tokens = tokenize(input)
      expect(tokens.map((x) => x.text).join(""), JSON.stringify(input)).toBe(input)
      // Only a text of spacing alone has a wordless token, and then it is the only one.
      expect(tokens.filter((x) => !x.word).length, JSON.stringify(input)).toBe(input.trim() || !input ? 0 : 1)
    }
  })
})

describe("diffWords", () => {
  it("marks a replaced word as removed, then added", () => {
    const parts = diffWords("A forklift carries two pallets.", "A forklift carries three pallets.")
    expect(parts.map((p) => [p.type, p.text])).toEqual([
      ["same", "A forklift carries "],
      ["removed", "two "],
      ["added", "three "],
      ["same", "pallets."],
    ])
  })
  it("rebuilds each text from its side of the diff", () => {
    const before = "The robot stops at the yellow line near dock B."
    const after = "A robot slows down and stops at the line near dock C, then waits."
    const parts = diffWords(before, after)
    expect(side(parts, "added")).toBe(after)
    expect(side(parts, "removed").split(/\s+/)).toEqual(before.split(/\s+/))
  })
  it("finds the longest run of shared words, not the first match", () => {
    const parts = diffWords("a b c d", "x a b c d")
    expect(parts.map((p) => p.type)).toEqual(["added", "same"])
    expect(diffStats(parts)).toEqual({ added: 1, removed: 0 })
  })
  it("counts words added and removed", () => {
    const parts = diffWords("A person stands by the shelf.", "A person in a hi-vis vest stands by the shelf")
    expect(diffStats(parts)).toEqual({ added: 5, removed: 1 })
  })
  it("returns one shared run when nothing changed", () => {
    const parts = diffWords("Two pallets on the floor.", "Two pallets on the floor.")
    expect(parts).toEqual([{ type: "same", text: "Two pallets on the floor.", words: 5 }])
  })
  it("returns all removed, then all added, when nothing is shared", () => {
    const parts = diffWords("red cup", "blue bowl here")
    expect(parts.map((p) => [p.type, p.words])).toEqual([
      ["removed", 2],
      ["added", 3],
    ])
  })
  it("handles empty texts on either side", () => {
    expect(diffWords("", "")).toEqual([])
    expect(diffWords("", "new caption").map((p) => p.type)).toEqual(["added"])
    expect(diffWords("old caption", "").map((p) => p.type)).toEqual(["removed"])
  })
  it("keeps a text of spacing alone, as shared spacing and not as a word changed", () => {
    expect(diffWords("  ", " ")).toEqual([{ type: "same", text: " ", words: 0 }])
    expect(diffWords("", "  ")).toEqual([{ type: "same", text: "  ", words: 0 }])
    expect(diffWords("  ", "")).toEqual([])
    const parts = diffWords("cup", " ")
    expect(side(parts, "added")).toBe(" ")
    expect(diffStats(parts)).toEqual({ added: 0, removed: 1 })
  })
  it("rebuilds the after text for generated pairs, spacing alone included", () => {
    const texts = ["", " ", "  ", "a", " a ", "a  b", "一台 機", "\n", "a\n"]
    for (const before of texts) for (const after of texts) expect(side(diffWords(before, after), "added")).toBe(after)
  })
  it("diffs Chinese by character", () => {
    expect(diffStats(diffWords("一台堆高機", "兩台堆高機"))).toEqual({ added: 1, removed: 1 })
  })
  it("stays fast on long texts", () => {
    const words = Array.from({ length: 1500 }, (_, i) => `w${i % 97}`)
    const changed = words.map((w, i) => (i % 50 === 0 ? "CHANGED" : w))
    const t = performance.now()
    const parts = diffWords(words.join(" "), changed.join(" "))
    expect(performance.now() - t).toBeLessThan(2000)
    expect(diffStats(parts)).toEqual({ added: 30, removed: 30 })
  })
})

describe("TextDiff", () => {
  it("marks insertions with <ins> and removals with <del>, each announced", () => {
    const { container } = render(<TextDiff before="Two pallets on the floor." after="Three pallets on the floor." />)
    const ins = container.querySelector("ins")!
    const del = container.querySelector("del")!
    expect(ins.textContent).toBe("added: Three (end)")
    expect(del.textContent).toBe("removed: Two (end)")
    // Shape first: insertions are a grey block with an underline, removals struck through. No status colour.
    expect(ins.className).toContain("bg-muted")
    expect(ins.className).toContain("underline")
    expect(del.className).toContain("line-through")
    expect(container.innerHTML).not.toMatch(/(danger|success|info|green|blue)/)
  })
  it("keeps a space where a change meets the last word, but none between Chinese characters", () => {
    const seen = (el: Element) => {
      const copy = el.cloneNode(true) as Element
      copy.querySelectorAll(".sr-only").forEach((s) => s.remove())
      return copy.textContent
    }
    const one = render(<TextDiff showSummary={false} before="across the warehouse floor." after="past the loading dock." />)
    expect(seen(one.container)).toBe("across past the warehouse floor. loading dock.")
    one.unmount()
    const two = render(<TextDiff showSummary={false} mode="side-by-side" before="a b c" after="a b" />)
    expect(seen(two.getByRole("region", { name: "Before" }))).toBe("Beforea b c")
    two.unmount()
    const three = render(<TextDiff showSummary={false} before="一台堆高機" after="兩台堆高機" />)
    expect(seen(three.container)).toBe("一兩台堆高機")
  })
  it("says how many words changed, with a real minus sign", () => {
    render(<TextDiff before="A red cup on the shelf" after="A blue cup on the top shelf" />)
    expect(screen.getByText("+2 words, −1 word")).toBeTruthy()
  })
  it("says when nothing changed", () => {
    render(<TextDiff before="Same caption." after="Same caption." />)
    expect(screen.getByText("No changes")).toBeTruthy()
  })
  it("side by side: removals on the left, insertions on the right, each column named", () => {
    render(<TextDiff mode="side-by-side" beforeLabel="Base model" afterLabel="Fine-tuned" before="A red cup" after="A blue cup" />)
    const left = screen.getByRole("region", { name: "Base model" })
    const right = screen.getByRole("region", { name: "Fine-tuned" })
    expect(left.querySelector("del")?.textContent).toContain("red")
    expect(left.querySelector("ins")).toBeNull()
    expect(right.querySelector("ins")?.textContent).toContain("blue")
    expect(right.querySelector("del")).toBeNull()
  })
})
