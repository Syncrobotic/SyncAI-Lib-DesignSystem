/** The card's width on /blocks: a third of the column on wide screens, half from md, the whole column on a phone. */
const sizes = "(min-width: 1024px) 18rem, (min-width: 768px) 45vw, 100vw"

/**
 * A block's picture on /blocks, as /docs/components shows a component's: taken from the block's preview by
 * scripts/thumbs.mjs (npm run thumbs -- --blocks), framed 16:10, light and dark, 400 and 800 px wide. One file per theme;
 * the browser fetches only the one that shows. A static image, not a live iframe (a copy of the site per card), keeps the
 * page's main thread free. Decorative: the card's title and description name the link.
 */
export function BlockThumb({ name }: { name: string }) {
  const src = (theme: "light" | "dark") => ({
    src: `/thumbs/blocks/${name}-${theme}-400.webp`,
    srcSet: `/thumbs/blocks/${name}-${theme}-400.webp 400w, /thumbs/blocks/${name}-${theme}-800.webp 800w`,
  })
  return (
    <div className="specimen aspect-16/10 overflow-hidden">
      <img {...src("light")} sizes={sizes} alt="" width={400} height={250} loading="lazy" decoding="async" className="block h-auto w-full dark:hidden" />
      <img {...src("dark")} sizes={sizes} alt="" width={400} height={250} loading="lazy" decoding="async" className="hidden h-auto w-full dark:block" />
    </div>
  )
}
