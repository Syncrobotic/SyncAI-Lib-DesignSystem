import { codeToHtml } from "shiki"

export function highlight(code: string, lang: "tsx" | "ts" | "css" | "bash" | "json") {
  return codeToHtml(code.trimEnd(), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
}
