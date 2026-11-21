// Syntax highlighting for the CodeBlock examples, the way a product plugs in a highlighter: CodeBlock draws the frame,
// the copy button, the wrapping and the scroll cue, and takes shiki's output as children.
//
// Synchronous (shiki's core with the JavaScript regex engine and only the grammars used here), so a story renders
// highlighted on its first paint and the visual checks never catch it half done. Colours are written as light-dark()
// pairs from GitHub's high-contrast themes, the same ones the docs site's own code uses; they follow the theme's
// color-scheme (light by default, dark inside .dark), so no stylesheet is needed.
import { createHighlighterCoreSync } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import bash from "shiki/langs/bash.mjs"
import json from "shiki/langs/json.mjs"
import tsx from "shiki/langs/tsx.mjs"
import dark from "shiki/themes/github-dark-high-contrast.mjs"
import light from "shiki/themes/github-light-high-contrast.mjs"

const shiki = createHighlighterCoreSync({ themes: [light, dark], langs: [bash, json, tsx], engine: createJavaScriptRegexEngine() })

export function Highlighted({ code, lang }: { code: string; lang: "bash" | "json" | "tsx" }) {
  let html = shiki.codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: "light-dark()",
  })
  // A shell command wraps between words and after a "/", never inside a name, as CodeBlock's plain text does.
  if (lang === "bash")
    html = html.replace(/>([^<]+)</g, (_, text: string) => `>${text.replace(/[^\s/]+\/?|\//g, (w) => `<span class="whitespace-nowrap">${w}</span>${w.endsWith("/") ? "<wbr>" : ""}`)}<`)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
