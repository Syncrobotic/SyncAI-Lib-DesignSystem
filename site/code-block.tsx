// The registry CodeBlock draws the frame, the copy button, the wrapping and the scroll cue; the site adds shiki.
import { CodeBlock as Frame } from "@/registry/syncrobotic/ui/code-block"
import { highlight } from "./highlight"

export async function CodeBlock({
  code,
  lang = "tsx",
  title,
}: {
  code: string
  lang?: Parameters<typeof highlight>[1]
  title?: string
}) {
  const highlighted = await highlight(code, lang)
  // A shell command wraps between words and after a "/", never inside a name: "@syncrobotic/" then "number-field".
  // The registry does this for plain text; shiki's HTML gets the same marks here.
  const html =
    lang === "bash" || lang === "text"
      ? highlighted.replace(/>([^<]+)</g, (_, text: string) => `>${text.replace(/[^\s/]+\/?|\//g, (w) => `<span class="whitespace-nowrap">${w}</span>${w.endsWith("/") ? "<wbr>" : ""}`)}<`)
      : highlighted
  return (
    <Frame code={code} title={title} language={lang} wrap={lang === "bash" || lang === "text" ? "words" : "none"} labels={{ code: lang === "text" ? "Text" : `${lang} code` }}>
      <div className="code" dangerouslySetInnerHTML={{ __html: html }} />
    </Frame>
  )
}
