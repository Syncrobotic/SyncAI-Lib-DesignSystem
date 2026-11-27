import { describe, expect, it } from "vitest"
import { blocks } from "@/site/blocks"
import { blockRenders } from "@/site/block-renders"

describe("block previews", () => {
  it("has a preview for every block at /preview/<name>", () => {
    expect(blocks.map((b) => b.name).filter((n) => !(n in blockRenders))).toEqual([])
  })
})
