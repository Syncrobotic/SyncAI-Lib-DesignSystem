import { codeToHtml } from "shiki"

export function highlight(code: string, lang: "tsx" | "ts" | "css" | "bash" | "json") {
  return codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
    defaultColor: false,
  })
}
