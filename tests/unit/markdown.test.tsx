import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { markdownLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { createMarkdownParser, Markdown, markdownToText, parseInline, parseMarkdown, safeHref, type MarkdownInline } from "@/registry/syncrobotic/ui/markdown"

afterEach(cleanup)

const md = (text: string, props: Partial<React.ComponentProps<typeof Markdown>> = {}) => render(<Markdown text={text} {...props} />).container
const inline = (text: string, options = {}) => parseInline(text, options)
const t = (value: string): MarkdownInline => ({ type: "text", value })

describe("parseInline", () => {
  it("reads emphasis, strong, strikethrough and their nesting", () => {
    expect(inline("a *b* c")).toEqual([t("a "), { type: "em", children: [t("b")] }, t(" c")])
    expect(inline("**b** and __c__")).toEqual([{ type: "strong", children: [t("b")] }, t(" and "), { type: "strong", children: [t("c")] }])
    expect(inline("***both***")).toEqual([{ type: "em", children: [{ type: "strong", children: [t("both")] }] }])
    expect(inline("*a **b** c*")).toEqual([{ type: "em", children: [t("a "), { type: "strong", children: [t("b")] }, t(" c")] }])
    expect(inline("~~gone~~ ~5 m")).toEqual([{ type: "del", children: [t("gone")] }, t(" ~5 m")])
  })

  it("leaves what is not emphasis as text: spaced stars, snake_case, a lone star", () => {
    expect(inline("2 * 3 * 4")).toEqual([t("2 * 3 * 4")])
    expect(inline("max_speed_limit")).toEqual([t("max_speed_limit")])
    expect(inline("**unclosed")).toEqual([t("**unclosed")])
  })

  it("reads strong next to Chinese punctuation", () => {
    expect(inline("這是**「重點」**之後")).toEqual([t("這是"), { type: "strong", children: [t("「重點」")] }, t("之後")])
    expect(inline("**粗體**，然後")).toEqual([{ type: "strong", children: [t("粗體")] }, t("，然後")])
  })

  it("reads code spans: any run length, stripping one space each side, nothing inside parsed", () => {
    expect(inline("run `npm test` now")).toEqual([t("run "), { type: "code", value: "npm test" }, t(" now")])
    expect(inline("`` a ` b ``")).toEqual([{ type: "code", value: "a ` b" }])
    expect(inline("`**not bold**`")).toEqual([{ type: "code", value: "**not bold**" }])
    expect(inline("a ` b")).toEqual([t("a ` b")])
  })

  it("reads links, angle links and bare URLs, without the sentence's last punctuation", () => {
    expect(inline("[the manual](https://example.com/m)")).toEqual([{ type: "link", href: "https://example.com/m", children: [t("the manual")] }])
    expect(inline('[t](https://e.com/a_(b) "Title")')).toEqual([{ type: "link", href: "https://e.com/a_(b)", children: [t("t")] }])
    expect(inline("<https://e.com/x>")).toEqual([{ type: "link", href: "https://e.com/x", children: [t("https://e.com/x")] }])
    expect(inline("See https://e.com/docs.")).toEqual([t("See "), { type: "link", href: "https://e.com/docs", children: [t("https://e.com/docs")] }, t(".")])
    expect(inline("(https://e.com/a)")).toEqual([t("("), { type: "link", href: "https://e.com/a", children: [t("https://e.com/a")] }, t(")")])
    expect(inline("[mail](mailto:ops@example.com)")).toEqual([{ type: "link", href: "mailto:ops@example.com", children: [t("mail")] }])
  })

  it("keeps emphasis inside a link and no link inside a link", () => {
    expect(inline("[**bold** words](https://e.com)")).toEqual([
      { type: "link", href: "https://e.com/", children: [{ type: "strong", children: [t("bold")] }, t(" words")] },
    ])
    // The inner link wins; the outer brackets are text (and its bare URL a link of its own, as in GFM).
    const nested = inline("[a [b](https://b.com) c](https://a.com)")
    expect(nested[0]).toEqual(t("[a "))
    expect(nested[1]).toEqual({ type: "link", href: "https://b.com/", children: [t("b")] })
    for (const n of nested) if (n.type === "link") expect(JSON.stringify(n.children)).not.toContain('"link"')
  })

  it("reads escapes, entities and line breaks", () => {
    expect(inline("\\*not em\\*")).toEqual([t("*not em*")])
    expect(inline("&amp; &lt;b&gt; &#169; &#x1F600; &bogus;")).toEqual([t("& <b> © 😀 &bogus;")])
    expect(inline("one\ntwo")).toEqual([t("one"), { type: "break" }, t("two")])
    expect(inline("one\ntwo", { breaks: false })).toEqual([t("one two")])
    expect(inline("one  \ntwo", { breaks: false })).toEqual([t("one"), { type: "break" }, t("two")])
    expect(inline("one\\\ntwo", { breaks: false })).toEqual([t("one"), { type: "break" }, t("two")])
  })

  it("reads images as pieces with their alt text", () => {
    expect(inline("![a *robot*](https://e.com/r.png)")).toEqual([{ type: "image", src: "https://e.com/r.png", alt: "a robot" }])
  })

  it("reads citation tokens only when asked", () => {
    expect(inline("Docked [1] and [^2], [3, 4].", { cite: true })).toEqual([
      t("Docked\u00A0"),
      { type: "cite", numbers: [1] },
      t(" and\u00A0"),
      { type: "cite", numbers: [2] },
      t(",\u00A0"),
      { type: "cite", numbers: [3, 4] },
      t("."),
    ])
    expect(inline("Docked [1].")).toEqual([t("Docked [1].")])
    // [1](url) is a link; [0] and [a] are not citations.
    expect(inline("[1](https://e.com) [0] [a]", { cite: true })[0]).toMatchObject({ type: "link" })
    expect(inline("[0] [a]", { cite: true })).toEqual([t("[0] [a]")])
  })
})

describe("parseInline while streaming (open)", () => {
  it("styles the words after an unclosed ** or * instead of showing the stars", () => {
    expect(inline("a **bol", { open: true })).toEqual([t("a "), { type: "strong", children: [t("bol")] }])
    expect(inline("a *ital", { open: true })).toEqual([t("a "), { type: "em", children: [t("ital")] }])
    expect(inline("a ***both", { open: true })).toEqual([t("a "), { type: "strong", children: [{ type: "em", children: [t("both")] }] }])
  })

  it("never shows half a closing run: **bold* stays strong, not a star and italics", () => {
    expect(inline("**bold*", { open: true })).toEqual([{ type: "strong", children: [t("bold")] }])
    expect(inline("text **", { open: true })).toEqual([t("text ")])
  })

  it("does not style an intraword star that may be text", () => {
    expect(inline("a*b and more", { open: true })).toEqual([t("a*b and more")])
  })

  it("shows an unclosed code span as code so far", () => {
    expect(inline("run `npm te", { open: true })).toEqual([t("run "), { type: "code", value: "npm te" }])
    expect(inline("run ``", { open: true })).toEqual([t("run ")])
  })

  it("shows a link's words while its URL arrives, and no brackets", () => {
    expect(inline("see [the man", { open: true })).toEqual([t("see the man")])
    expect(inline("see [the manual](https://exa", { open: true })).toEqual([t("see the manual")])
    expect(inline("see https://example.com/do", { open: true })).toEqual([t("see https://example.com/do")])
  })

  it("holds back a citation token until it closes", () => {
    expect(inline("Docked [1", { open: true, cite: true })).toEqual([t("Docked ")])
    expect(inline("Docked [^", { open: true, cite: true })).toEqual([t("Docked ")])
  })
})

describe("parseMarkdown", () => {
  it("reads every block it supports", () => {
    const blocks = parseMarkdown(
      [
        "# Title",
        "",
        "A paragraph",
        "on two lines.",
        "",
        "- one",
        "- two",
        "  1. nested",
        "",
        "> quoted",
        "",
        "```ts",
        "const a = 1",
        "```",
        "",
        "| A | B |",
        "|:--|--:|",
        "| 1 | 2 |",
        "",
        "---",
      ].join("\n"),
    )
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "list", "quote", "code", "table", "rule"])
    const list = blocks[2]
    expect(list?.type === "list" && list.items[1]?.blocks.map((b) => b.type)).toEqual(["paragraph", "list"])
    const table = blocks[5]
    expect(table?.type === "table" && [table.head, table.align, table.rows]).toEqual([["A", "B"], ["left", "right"], [["1", "2"]]])
    const code = blocks[4]
    expect(code?.type === "code" && [code.lang, code.code, code.closed]).toEqual(["ts", "const a = 1", true])
  })

  it("nests lists by indentation, two spaces under a number included", () => {
    const [list] = parseMarkdown("1. Dock\n  - plate\n  - contacts\n2. Charge\n    - wait")
    expect(list?.type).toBe("list")
    if (list?.type !== "list") return
    expect(list.items).toHaveLength(2)
    expect(list.items.map((i) => i.blocks.map((b) => b.type))).toEqual([
      ["paragraph", "list"],
      ["paragraph", "list"],
    ])
  })

  it("tells tight lists from loose ones", () => {
    const [tight] = parseMarkdown("- a\n- b")
    const [loose] = parseMarkdown("- a\n\n- b")
    expect(tight?.type === "list" && tight.tight).toBe(true)
    expect(loose?.type === "list" && loose.tight).toBe(false)
  })

  it("keeps an ordered list's start and a fence's info", () => {
    const [list, code] = parseMarkdown("3. third\n4. fourth\n\n~~~python extra\nprint()\n~~~")
    expect(list?.type === "list" && list.from).toBe(3)
    expect(code?.type === "code" && code.lang).toBe("python")
  })

  it("is not fooled by markers that are not blocks", () => {
    expect(parseMarkdown("#hashtag").map((b) => b.type)).toEqual(["paragraph"])
    expect(parseMarkdown("-not a list").map((b) => b.type)).toEqual(["paragraph"])
    expect(parseMarkdown("a | b\nno delimiter").map((b) => b.type)).toEqual(["paragraph"])
    expect(parseMarkdown("    four spaces").map((b) => b.type)).toEqual(["paragraph"])
  })

  it("an unclosed fence is code to the end", () => {
    const [code] = parseMarkdown("```js\nconst a = 1\n")
    expect(code?.type === "code" && [code.code, code.closed]).toEqual(["const a = 1\n".trimEnd() + "\n", false])
  })

  it("normalises Windows line ends and NUL", () => {
    expect(parseMarkdown("a\r\n\r\nb\0").map((b) => (b.type === "paragraph" ? b.text : ""))).toEqual(["a", "b�"])
  })
})

describe("parseMarkdown while streaming", () => {
  const types = (text: string) => parseMarkdown(text, { streaming: true }).map((b) => b.type)

  it("holds back a line that is only a marker so far", () => {
    for (const tail of ["#", "## ", "-", "- ", "1.", "> ", "|", "``", "---", "**"]) expect(types(`Intro\n\n${tail}`)).toEqual(["paragraph"])
    expect(types("Intro\n\n## Dock")).toEqual(["paragraph", "heading"])
  })

  it("keeps a marker-like line inside an open fence", () => {
    const [code] = parseMarkdown("```md\n# not a heading\n---", { streaming: true })
    expect(code?.type === "code" && code.code).toBe("# not a heading\n---")
  })

  it("holds back a table's header until its delimiter line, then shows the table", () => {
    expect(types("Results:\n| Robot | State |")).toEqual(["paragraph"])
    expect(parseMarkdown("Results:\n| Robot | State |", { streaming: true })[0]).toMatchObject({ text: "Results:" })
    expect(types("| Robot | State |\n|--")).toEqual([])
    expect(types("| Robot | State |\n|---|---|\n| 7F3A | Docked")).toEqual(["table"])
  })

  it("does not hold anything back once the text is whole", () => {
    expect(parseMarkdown("Intro\n\n#", { streaming: false }).map((b) => b.type)).toEqual(["paragraph", "heading"])
  })
})

describe("createMarkdownParser (incremental)", () => {
  const answer = [
    "## Docking check",
    "",
    "The **dock plate** is clear [1].",
    "",
    "- Contacts: uncovered",
    "- Box: 40 cm to the left",
    "  - outside the path",
    "",
    "| Robot | State |",
    "|---|---|",
    "| 7F3A | Docked |",
    "",
    "```bash",
    "ros2 topic echo /dock/state",
    "```",
    "",
    "> Checked at 14:02.",
  ].join("\n")

  it("gives the same blocks as a full parse at every length, streaming or not", () => {
    const parser = createMarkdownParser()
    for (let n = 1; n <= answer.length; n++) {
      const part = answer.slice(0, n)
      expect(parser.parse(part, true)).toEqual(parseMarkdown(part, { streaming: true }))
    }
    expect(parser.parse(answer, false)).toEqual(parseMarkdown(answer))
  })

  it("returns finished blocks as the same objects, so they are not drawn again", () => {
    const parser = createMarkdownParser()
    const a = parser.parse(answer.slice(0, 60), true)
    const b = parser.parse(answer.slice(0, 120), true)
    expect(b[0]).toBe(a[0])
    expect(b[1]).toBe(a[1])
  })

  it("starts over when the text is replaced", () => {
    const parser = createMarkdownParser()
    parser.parse("# One\n\nFirst answer", false)
    expect(parser.parse("Second answer", false)).toEqual(parseMarkdown("Second answer"))
  })
})

describe("Markdown", () => {
  it("renders real elements", () => {
    const c = md("# Title\n\nSome *em* and **strong** and `code`.\n\n- a\n- b\n\n1. x\n\n> q\n\n---\n\n| A | B |\n|---|--:|\n| 1 | 2 |")
    expect(c.querySelector("h3")?.textContent).toBe("Title")
    expect(c.querySelector("p em")?.textContent).toBe("em")
    expect(c.querySelector("p strong")?.textContent).toBe("strong")
    expect(c.querySelector("[data-slot=code]")?.textContent).toBe("code")
    expect(c.querySelectorAll("ul > li")).toHaveLength(2)
    expect(c.querySelector("ol > li")?.textContent).toBe("x")
    expect(c.querySelector("blockquote p")?.textContent).toBe("q")
    expect(c.querySelector("hr")).toBeTruthy()
    expect(c.querySelector("[data-slot=table] th:nth-child(2)")?.className).toContain("text-right")
    expect(c.querySelector("[data-slot=table] td")?.textContent).toBe("1")
  })

  it("starts headings at headingLevel and never skips a level", () => {
    const c = md("### Deep first\n\n##### Deeper\n\n# Top\n\n### Next", { headingLevel: 2 })
    expect([...c.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => `${h.tagName}:${h.textContent}`)).toEqual(["H2:Deep first", "H3:Deeper", "H2:Top", "H3:Next"])
    expect(md("# A").querySelector("h3")).toBeTruthy()
    expect(md("###### A", { headingLevel: 6 }).querySelector("h6")).toBeTruthy()
  })

  it("renders a code fence as the kit's CodeBlock with Copy and the language", () => {
    const c = md("```python\nprint('hi')\n```")
    expect(c.querySelector("[data-slot=code-block]")).toBeTruthy()
    expect(c.querySelector("[data-slot=code-block-header]")?.textContent).toContain("python")
    expect(c.querySelector("code")?.textContent).toBe("print('hi')")
    expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy()
  })

  it("renders tight list items without paragraphs and loose ones with them", () => {
    expect(md("- a\n- b").querySelector("li p")).toBeNull()
    cleanup()
    expect(md("- a\n\n- b").querySelector("li p")).toBeTruthy()
  })

  it("keeps an ordered list's start and nests a list inside an item", () => {
    const c = md("3. three\n   - inner")
    expect(c.querySelector("ol")?.getAttribute("start")).toBe("3")
    expect(c.querySelector("ol > li > ul > li")?.textContent).toBe("inner")
  })

  it("opens http(s) links in a new tab, says so, and keeps mailto in place", () => {
    md("[Docs](https://example.com/docs) and [mail](mailto:ops@example.com)")
    const docs = screen.getByRole("link", { name: "Docs (opens in a new tab)" })
    expect(docs.getAttribute("href")).toBe("https://example.com/docs")
    expect(docs.getAttribute("target")).toBe("_blank")
    expect(docs.getAttribute("rel")).toBe("noopener noreferrer nofollow")
    const mail = screen.getByRole("link", { name: "mail" })
    expect(mail.getAttribute("target")).toBeNull()
  })

  it("keeps links in the same tab with newTab={false}", () => {
    md("[Docs](https://example.com)", { newTab: false })
    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("target")).toBeNull()
  })

  it("does not load a picture by default: a link to it with its alt text", () => {
    const c = md("![Dock camera](https://cdn.example.com/dock.jpg)")
    expect(c.querySelector("img")).toBeNull()
    const link = screen.getByRole("link", { name: "Image: Dock camera (opens in a new tab)" })
    expect(link.getAttribute("href")).toBe("https://cdn.example.com/dock.jpg")
  })

  it("loads a picture only from an allowed origin, without a referrer", () => {
    const c = md("![Dock](https://cdn.example.com/dock.jpg) ![Other](https://evil.example.net/x.jpg)", { imageOrigins: ["https://cdn.example.com"] })
    const imgs = c.querySelectorAll("img")
    expect(imgs).toHaveLength(1)
    expect(imgs[0]?.getAttribute("alt")).toBe("Dock")
    expect(imgs[0]?.getAttribute("referrerpolicy")).toBe("no-referrer")
    expect(imgs[0]?.getAttribute("loading")).toBe("lazy")
    expect(screen.getByRole("link", { name: /Image: Other/ })).toBeTruthy()
  })

  it("renders citation tokens through cite, and as text without it", () => {
    const c = md("Clear [1].", { cite: (n) => <button type="button">cite {n}</button> })
    expect(screen.getByRole("button", { name: "cite 1" })).toBeTruthy()
    expect(c.textContent).toBe("Clear\u00A0cite 1.")
    cleanup()
    expect(md("Clear [1].").textContent).toBe("Clear [1].")
  })

  it("renders a streaming answer without flashing syntax", () => {
    const c = md("The **dock pl", { streaming: true })
    expect(c.textContent).toBe("The dock pl")
    expect(c.querySelector("strong")?.textContent).toBe("dock pl")
    cleanup()
    expect(md("Steps:\n\n1.", { streaming: true }).querySelector("ol")).toBeNull()
  })

  it("an unclosed fence renders as code so far", () => {
    const c = md("```bash\nros2 topic", { streaming: true })
    expect(c.querySelector("[data-slot=code-block] code")?.textContent).toBe("ros2 topic")
  })

  it("redraws only the blocks that changed as the text grows", () => {
    const seen: number[] = []
    const cite = (n: number) => {
      seen.push(n)
      return <sup>{n}</sup>
    }
    const { rerender } = render(<Markdown text={"First [1].\n\nSecond"} cite={cite} streaming />)
    expect(seen).toEqual([1])
    rerender(<Markdown text={"First [1].\n\nSecond paragraph [2"} cite={cite} streaming />)
    rerender(<Markdown text={"First [1].\n\nSecond paragraph [2]."} cite={cite} streaming />)
    // The first paragraph was drawn once; the second drew its marker once it closed.
    expect(seen).toEqual([1, 2])
  })

  it("takes its words from labels (zh-TW)", () => {
    md("![機器人](https://e.com/r.png) [文件](https://e.com)", { labels: markdownLabels })
    expect(screen.getByRole("link", { name: "圖片：機器人 （在新分頁開啟）" })).toBeTruthy()
  })
})

describe("markdownToText", () => {
  it("is the words without the syntax, one block per line", () => {
    const text = markdownToText("## Dock\n\nThe **plate** is [clear](https://e.com).\n\n- one\n- two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```py\nx = 1\n```")
    expect(text).toBe("Dock\nThe plate is clear.\none\ntwo\nA, B\n1, 2\nCode in py.")
  })

  it("leaves citations out with cite, and styles what is forming while streaming", () => {
    expect(markdownToText("Clear [1], mostly [2, 3].", { cite: true })).toBe("Clear, mostly.")
    expect(markdownToText("The **dock pl", { streaming: true })).toBe("The dock pl")
  })
})

describe("safety", () => {
  it("never renders raw HTML: tags are text", () => {
    const c = md('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\nText with <b>bold</b> and <iframe src="https://e.com"></iframe>')
    expect(c.querySelector("script, iframe, b")).toBeNull()
    expect(c.querySelector("img")).toBeNull()
    expect(c.textContent).toContain("<script>alert(1)</script>")
    expect(c.textContent).toContain('<img src=x onerror="alert(1)">')
    expect(c.innerHTML).not.toContain("<script")
  })

  it("keeps HTML in code as text too", () => {
    const c = md("`<script>x</script>`\n\n```html\n<script>alert(1)</script>\n```")
    expect(c.querySelector("script")).toBeNull()
    expect(c.querySelector("[data-slot=code-block] code")?.textContent).toBe("<script>alert(1)</script>")
  })

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java\tscript:alert(1)",
    "java&#x09;script:alert(1)",
    " javascript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "file:///etc/passwd",
    "/relative/path",
    "//evil.example.com",
    "#top",
  ])("renders a link to %s as its words, never a link", (href) => {
    const c = md(`[click me](${href}) and <${href}>`)
    expect(c.querySelector("a")).toBeNull()
    expect(c.textContent).toContain("click me")
  })

  it("never puts a script URL on a picture", () => {
    const c = md("![x](javascript:alert(1)) ![y](data:image/svg+xml,<svg onload=alert(1)>)", { imageOrigins: ["null", "data:"] })
    expect(c.querySelector("img, a")).toBeNull()
  })

  it("safeHref allows only http, https and mailto", () => {
    expect(safeHref("https://e.com/a b")).toBe("https://e.com/a%20b")
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c")
    expect(safeHref("javascript:alert(1)")).toBeNull()
    expect(safeHref("\u0000javascript:alert(1)")).toBeNull()
    expect(safeHref("ftp://e.com")).toBeNull()
  })

  it("has no dangerouslySetInnerHTML or HTML parsing in its source", async () => {
    const { readFileSync } = await import("node:fs")
    const source = readFileSync("registry/syncrobotic/ui/markdown.tsx", "utf8")
    expect(source).not.toMatch(/dangerouslySetInnerHTML=|\.innerHTML|\.outerHTML|DOMParser|createContextualFragment|insertAdjacentHTML|document\.write/)
  })
})

// Each input is about 100 KB built to make a naive parser backtrack or recurse; a linear one reads each in a few ms.
// The budget is wide for slow CI machines and still far under what quadratic work on these inputs takes (seconds).
describe("hostile input (time budget)", () => {
  const N = 20_000
  const budget = 1500
  const cases: [string, string][] = [
    ["stars", "*".repeat(N * 5)],
    ["star-word pairs", "*a ".repeat(N)],
    ["unclosed strong openers", "**a ".repeat(N)],
    ["mixed delimiters", "*_~~".repeat(N)],
    ["openers then closers", "*a ".repeat(N / 2) + "a* ".repeat(N / 2)],
    ["backtick runs of growing length", Array.from({ length: 300 }, (_, i) => "`".repeat(i + 1) + " x ").join("")],
    ["single backticks", "`a ".repeat(N)],
    ["brackets", "[".repeat(N * 5)],
    ["unclosed link destinations", "[a](".repeat(N)],
    ["unclosed link destinations without spaces", "[a](b".repeat(N)],
    ["link titles", '[a](b "'.repeat(N)],
    ["citations", "[1, 2, ".repeat(N)],
    ["angle brackets", "<".repeat(N * 5)],
    ["bare URL starts", "https://".repeat(N)],
    ["entities", "&amp".repeat(N)],
    ["escapes", "\\".repeat(N * 5)],
    ["deeply nested lists", Array.from({ length: 1000 }, (_, i) => " ".repeat(i * 2) + "- x").join("\n")],
    ["deeply nested quotes", ">".repeat(N * 5) + " x"],
    ["nested list markers on one line", "- ".repeat(N)],
    ["many headings", "# h\n".repeat(N)],
    ["pipes", "|".repeat(N * 5) + "\n" + "|-".repeat(N)],
    ["wide table", "|a".repeat(5000) + "\n" + "|-".repeat(5000) + "\n" + "|1".repeat(5000)],
    ["fences", "```\n".repeat(N)],
    ["long line of spaces", " ".repeat(N * 5) + "#"],
    ["heading with closing hashes", "# " + "# ".repeat(N * 2) + "x"],
    ["link destinations with one far paren", "[a](b".repeat(N) + ")"],
    ["angle brackets with one far close", "<a".repeat(N * 2) + ">"],
    ["an unclosed title", '[a](b "' + "x".repeat(N * 5) + ")"],
    ["entities without a semicolon", "&#".repeat(N * 2) + ";"],
  ]

  it.each(cases)("%s", (_, input) => {
    const start = performance.now()
    parseMarkdown(input)
    parseMarkdown(input, { streaming: true })
    markdownToText(input, { cite: true })
    const ms = performance.now() - start
    expect(ms).toBeLessThan(budget)
  })

  it.each(cases)("%s: inline alone", (_, input) => {
    const start = performance.now()
    parseInline(input, { cite: true })
    parseInline(input, { open: true, cite: true })
    expect(performance.now() - start).toBeLessThan(budget)
  })

  it("grows linearly: four times the input takes about four times as long, not sixteen", () => {
    const unit = "*a **b [c](d `e <f &g; ~~h ".repeat(500) + "\n- i\n  - j\n> k\n| l | m |\n|---|---|\n| n | o |\n\n"
    const once = (text: string) => {
      const t0 = performance.now()
      parseMarkdown(text)
      parseInline(text, { open: true, cite: true })
      return performance.now() - t0
    }
    once(unit) // warm up
    // The two sizes take turns and each keeps its best of seven, so a garbage collection or a busy machine (the whole
    // suite runs in parallel) that lands on one run of the larger size does not decide the ratio. Linear is about 4,
    // quadratic about 16: 10 tells them apart.
    const small = unit.repeat(5)
    const large = unit.repeat(20)
    let one = Infinity
    let four = Infinity
    for (let k = 0; k < 7; k++) {
      one = Math.min(one, once(small))
      four = Math.min(four, once(large))
    }
    expect(four / one).toBeLessThan(10)
  })

  it("renders deeply nested input without overflowing the stack", () => {
    const deep = Array.from({ length: 500 }, (_, i) => " ".repeat(i * 2) + "- level").join("\n")
    const c = md(deep + "\n\n" + "*a ".repeat(2000) + "\n\n" + ">".repeat(2000) + " quote")
    expect(c.querySelectorAll("ul").length).toBeLessThanOrEqual(8)
    expect(c.querySelectorAll("blockquote").length).toBeLessThanOrEqual(8)
  })

  it("keeps inline nesting bounded", () => {
    const deep = "*a **b ".repeat(200) + " b** a*".repeat(200)
    const c = md(deep)
    let depth = 0
    for (let el: Element | null = c.querySelector("p em, p strong"); el; el = el.querySelector(":scope > em, :scope > strong")) depth++
    expect(depth).toBeLessThanOrEqual(26)
  })
})

describe("streaming performance", () => {
  // A 20 KB answer of headings, paragraphs, lists, a table and code, appended in 200 chunks as a model streams it.
  const section = (i: number) =>
    [
      `## Section ${i}`,
      "",
      `The robot **7F3A** reached waypoint ${i} at 14:0${i % 10}; the dock plate is *clear* and the \`contacts\` are uncovered [1].`,
      "",
      "- Battery: 82 %",
      "- Path: clear",
      "  - box 40 cm to the left",
      "",
      "| Check | Result |",
      "|---|---|",
      "| Plate | Clear |",
      "| Contacts | Uncovered |",
      "",
      "```bash",
      "ros2 topic echo /dock/state --once",
      "```",
      "",
    ].join("\n")
  let answer = ""
  for (let i = 0; answer.length < 20_000; i++) answer += section(i)
  answer = answer.slice(0, 20_000)
  const chunk = Math.ceil(answer.length / 200)
  const steps = Array.from({ length: 200 }, (_, i) => answer.slice(0, Math.min(answer.length, (i + 1) * chunk)))

  it("parses 200 growing chunks of 20 KB incrementally in far less than a full parse each", () => {
    const parser = createMarkdownParser()
    const t0 = performance.now()
    for (const s of steps) parser.parse(s, true)
    const incremental = performance.now() - t0
    const t1 = performance.now()
    for (const s of steps) parseMarkdown(s, { streaming: true })
    const full = performance.now() - t1
    console.info(`markdown parse, 20 KB in 200 chunks: incremental ${incremental.toFixed(1)} ms, full re-parse ${full.toFixed(1)} ms`)
    expect(incremental).toBeLessThan(full)
    expect(incremental).toBeLessThan(500)
  })

  it("renders 200 growing chunks of 20 KB within budget", () => {
    const { rerender, container } = render(<Markdown text="" streaming />)
    const times: number[] = []
    for (const s of steps) {
      const t = performance.now()
      rerender(<Markdown text={s} streaming />)
      times.push(performance.now() - t)
    }
    rerender(<Markdown text={answer} />)
    const total = times.reduce((a, b) => a + b, 0)
    const sorted = [...times].sort((a, b) => a - b)
    const p50 = sorted[100]!
    const max = sorted[199]!
    console.info(`markdown render, 20 KB in 200 chunks (jsdom): total ${total.toFixed(0)} ms, median ${p50.toFixed(2)} ms, max ${max.toFixed(1)} ms per update`)
    expect(container.querySelectorAll("h3").length).toBeGreaterThan(20)
    expect(total).toBeLessThan(10_000)
  })
})
