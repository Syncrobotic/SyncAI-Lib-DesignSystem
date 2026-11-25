import { existsSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { blockCards } from "@/site/blocks"

// The /blocks cards are pictures (scripts/thumbs.mjs --blocks), not live previews: each card's block has its four files,
// light and dark at 400 and 800 px, and no picture is left over from a block that no longer stands for a type.
// Part of npm run lint:thumbs, with the components' check in the script itself.
const OUT = "public/thumbs/blocks"
const files = (name: string) => ["light", "dark"].flatMap((t) => [400, 800].map((w) => `${name}-${t}-${w}.webp`))

describe("block thumbnails", () => {
  const cards = blockCards()

  it("has a card for every Application and Solutions type", () => {
    expect(cards.length).toBeGreaterThanOrEqual(10)
  })

  it("has every card's picture and nothing else (npm run build && npm run thumbs -- --blocks)", () => {
    const want = new Set(cards.flatMap((c) => files(c.name)))
    const have = new Set(existsSync(OUT) ? readdirSync(OUT) : [])
    expect({ missing: [...want].filter((f) => !have.has(f)), extra: [...have].filter((f) => !want.has(f)) }).toEqual({ missing: [], extra: [] })
  })
})
