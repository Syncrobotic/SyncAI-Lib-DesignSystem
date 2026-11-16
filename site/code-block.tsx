import { CopyButton } from "./copy-button"
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
  const html = await highlight(code, lang)
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border py-1 pr-1 pl-4">
        <span className="font-mono text-xs text-muted-foreground">{title ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <div className="code overflow-x-auto p-4 text-sm" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
