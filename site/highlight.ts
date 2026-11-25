import { codeToHtml } from "shiki"

// shiki writes both themes' colours on every token: `<span style="--shiki-light:#A0111F;--shiki-dark:#FF9492">`, 56
// bytes before the word, and a page carries its HTML twice (the markup and the React payload). The two GitHub themes
// colour code with eight pairs, so each pair is a class instead (app/globals.css sets its two variables), and a token in
// the code's own colour, the pre's, loses its span: the line it sits in draws it in that colour already. The same
// pixels in half the bytes; a pair not in this list keeps its style attribute.
const pairs: Record<string, string> = {
  "A0111F FF9492": "hk",
  "032563 ADDCFF": "hs",
  "023B95 91CBFF": "hc",
  "622CBC DBB7FF": "hf",
  "024C1A 72F088": "ht",
  "702C00 FFB757": "hv",
  "66707B BDC4CC": "hm",
}
/** The code's own colour, which the `<pre>` sets. */
const PLAIN = "0E1116 F0F3F6"

/** shiki's HTML with its token colours as classes (see `pairs`). */
export function compact(html: string) {
  return html.replace(/<span style="--shiki-light:#(\w{6});--shiki-dark:#(\w{6})">([^<]*)<\/span>/g, (span, light: string, dark: string, text: string) => {
    const pair = `${light} ${dark}`
    if (pair === PLAIN) return text
    return pairs[pair] ? `<span class="${pairs[pair]}">${text}</span>` : span
  })
}

// "text" is prose to paste (a prompt to an agent): no colours, so nothing in it looks like code it is not.
export async function highlight(code: string, lang: "tsx" | "ts" | "css" | "bash" | "json" | "text") {
  const html = await codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: false,
    // CodeBlock's scroll area is the one Tab stop; shiki's own tabindex on <pre> would add a second, useless one.
    tabindex: false,
  })
  return compact(html)
}
