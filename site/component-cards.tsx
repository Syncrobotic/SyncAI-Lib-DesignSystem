"use client"

import Link from "next/link"
import { AppearItem, Reveal } from "./appear"

// The /docs/components grid. A client component so the page's React payload carries each card as its three strings, not
// as the card's elements a second time beside the HTML; the card's look is CSS (.component-cards in app/globals.css), so
// none of its class strings are repeated on 110 cards either.

/** A card: the component's name (its page), title and description. */
export type CardData = [name: string, title: string, description: string]

// The grid's card width: a third of the column on wide screens, half from md, the whole column on a phone.
const sizes = "(min-width: 1024px) 18rem, (min-width: 768px) 45vw, 100vw"

/**
 * A component's picture: its first story, cropped and framed, taken by scripts/thumbs.mjs (npm run thumbs). One file per
 * theme; the browser fetches only the one that shows. Decorative: the card's title and description are the link's name.
 */
function Thumb({ name }: { name: string }) {
  const img = (theme: "light" | "dark") => (
    <img
      src={`/thumbs/components/${name}-${theme}-400.webp`}
      srcSet={`/thumbs/components/${name}-${theme}-400.webp 400w, /thumbs/components/${name}-${theme}-800.webp 800w`}
      sizes={sizes}
      alt=""
      width={400}
      height={250}
      loading="lazy"
      decoding="async"
    />
  )
  return (
    <>
      {img("light")}
      {img("dark")}
    </>
  )
}

/** As a block's card on /blocks: the picture is framed (it is a picture of the component); the words under it are not boxed. */
export function ComponentCards({ cards }: { cards: CardData[] }) {
  return (
    <Reveal className="component-cards">
      {cards.map(([name, title, description]) => (
        <AppearItem key={name}>
          <Link href={`/docs/components/${name}`}>
            <div className="specimen">
              <Thumb name={name} />
            </div>
            <div>
              <span>{title}</span>
              {/* The whole description: a clamp cut it mid-word, and none is longer than three sentences. */}
              {description && <span>{description}</span>}
            </div>
          </Link>
        </AppearItem>
      ))}
    </Reveal>
  )
}
