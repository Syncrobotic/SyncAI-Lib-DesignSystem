import { Fragment } from "react"
import { Kbd, KbdGroup } from "@/registry/syncrobotic/ui/kbd"

/**
 * A keyboard table's key cell, written in site/catalog.ts as text with each key in backticks: "Hold `Enter` / `Space` 2 s",
 * "`Shift`+`↑`". A key is a Kbd; keys joined by "+" with no space are one chord (a KbdGroup); everything else, the "/"
 * between alternatives and words such as "Hold" or "away", stays text. One notation: ↑ ↓ ← →, Esc, PageUp, Home.
 */
export type KeyPart = { text: string } | { keys: string[] }

export function parseKeys(cell: string): KeyPart[] {
  const parts: KeyPart[] = []
  // A chord: `A`+`B`(+`C`…); a single key: `A`; text: anything up to the next backtick.
  for (const m of cell.matchAll(/((?:`[^`]+`\+)*`[^`]+`)|([^`]+)/g)) {
    if (m[1]) parts.push({ keys: [...m[1].matchAll(/`([^`]+)`/g)].map((k) => k[1]) })
    else parts.push({ text: m[2] })
  }
  return parts
}

export function KeyCell({ keys }: { keys: string }) {
  return (
    // Inline, not flex: the text keeps its own spaces, so a comma stays beside its key. leading-7 leaves room for a 24 px key.
    <span className="leading-7">
      {parseKeys(keys).map((p, i) =>
        "text" in p ? (
          <Fragment key={i}>{p.text}</Fragment>
        ) : p.keys.length === 1 ? (
          <Kbd key={i}>{p.keys[0]}</Kbd>
        ) : (
          <KbdGroup key={i}>
            {p.keys.map((k, j) => (
              <Fragment key={j}>
                {/* The plus is read, not drawn ("Shift plus Tab"), as KbdGroup says. */}
                {j > 0 && <span className="sr-only">+</span>}
                <Kbd>{k}</Kbd>
              </Fragment>
            ))}
          </KbdGroup>
        ),
      )}
    </span>
  )
}
