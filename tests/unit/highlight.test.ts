// @vitest-environment node
import { describe, expect, it } from "vitest"
import { compact, highlight } from "@/site/highlight"

// The site's listings carry token colours as classes (site/highlight.ts, app/globals.css). If a shiki or theme update
// brings a colour pair the list does not know, its tokens keep their style attribute: still right, only heavier. This
// notices it, so the pair is added to both files.
describe("highlight", () => {
  it("writes every token colour of the site's languages as a class", async () => {
    const samples = {
      tsx: `"use client"\nimport * as React from "react"\n// a comment\nexport function A({ n }: { n: number }) {\n  const [x, setX] = React.useState(0)\n  return <div className="a" onClick={() => setX(x + n)}>{x}</div>\n}`,
      ts: `export type T = { a?: string }\nexport const f = async (t: T): Promise<{ error?: string }> => ({ error: t.a ?? undefined })`,
      css: `@import "tailwindcss";\n/* c */\n:root {\n  --font-sans: var(--x), "Noto Sans TC", system-ui, sans-serif;\n}\n@custom-variant dark (&:where(.dark, .dark *));`,
      bash: `# c\nsudo apt install ros-$ROS_DISTRO-rosbridge-suite\nnpx shadcn add @syncrobotic/use-ros`,
      json: `{ "$schema": "https://ui.shadcn.com/schema.json", "rsc": true, "n": 1 }`,
    } as const
    for (const [lang, code] of Object.entries(samples)) {
      const html = await highlight(code, lang as keyof typeof samples)
      expect(html, lang).not.toMatch(/<span style="--shiki-light:/)
      // The text is all there.
      expect(html.replace(/<[^>]+>/g, "").replace(/&#x3C;/g, "<").replace(/&quot;/g, '"').replace(/&#x26;/g, "&").replace(/&#39;/g, "'")).toBe(code)
    }
  })

  it("keeps a pair it does not know, and drops the span of a token in the code's own colour", () => {
    const pre = '<pre><code><span class="line"><span style="--shiki-light:#0E1116;--shiki-dark:#F0F3F6"> x </span>'
    const odd = '<span style="--shiki-light:#123456;--shiki-dark:#654321">y</span>'
    expect(compact(`${pre}${odd}<span style="--shiki-light:#A0111F;--shiki-dark:#FF9492">z</span></span></code></pre>`)).toBe(
      `<pre><code><span class="line"> x ${odd}<span class="hk">z</span></span></code></pre>`,
    )
  })
})
