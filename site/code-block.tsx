// The registry CopyButton: one implementation, with the plain-HTTP fallback and the failure message.
import { CopyButton } from "@/registry/syncrobotic/ui/copy-button"
import { highlight } from "./highlight"
import { Unbroken } from "./prose"

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
  const html =
    lang === "bash"
      ? highlighted.replace(/>([^<]+)</g, (_, text: string) => `>${text.replace(/[^\s/]+\/?|\//g, (w) => `<span class="whitespace-nowrap">${w}</span>${w.endsWith("/") ? "<wbr>" : ""}`)}<`)
      : highlighted
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-4">
        <span className="font-mono text-xs text-muted-foreground">
          <Unbroken text={title ?? lang} />
        </span>
        <CopyButton value={code} label={title ? `Copy ${title}` : "Copy code"} />
      </div>
      <div tabIndex={0} role="group" aria-label={title ?? `${lang} code`} className={`code overflow-x-auto p-4 text-sm ${lang === "bash" ? "code-wrap" : "code-edge"}`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
