import { codeToHtml } from "shiki"

// "text" is prose to paste (a prompt to an agent): no colours, so nothing in it looks like code it is not.
export function highlight(code: string, lang: "tsx" | "ts" | "css" | "bash" | "json" | "text") {
  return codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: false,
    // CodeBlock's scroll area is the one Tab stop; shiki's own tabindex on <pre> would add a second, useless one.
    tabindex: false,
  })
}
