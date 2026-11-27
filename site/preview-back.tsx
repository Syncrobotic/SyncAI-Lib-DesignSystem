import { ArrowLeft } from "lucide-react"

/**
 * On a preview opened in its own tab (not inside the docs' frame), a way back to the block's docs: a strip above the block,
 * not a button floating over it, so it never covers the block's own controls (the stop, a form's Cancel).
 *
 * Whether the page is framed is known only in the browser. The strip is in the server's HTML, and a script that runs as
 * the HTML is parsed, before the first paint, marks a framed page, which hides it: rendered after hydration instead, it
 * pushed the whole block down 44 px on every load.
 */
export function PreviewBack({ href }: { href: string }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "if(self!==top)document.documentElement.setAttribute('data-framed','')" }} />
      {/*
        A shell that fills the screen fills what is left under the strip, so its bottom (the stop, the user menu) stays on
        screen. A full-screen block (a dialog or sheet over its page, a sign-in screen) is held to the same height, so the
        page never scrolls 44 px for nothing and no band under it is left outside a dialog's scrim.
      */}
      <style>{":root:not([data-framed]){--app-shell-height:calc(100dvh - var(--h-md))}[data-framed] [data-slot=preview-back]{display:none}"}</style>
      <a
        data-slot="preview-back"
        href={href}
        className="press flex h-(--h-md) items-center gap-2 border-b border-border bg-card px-4 text-sm font-medium hover:bg-accent"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to the docs
      </a>
    </>
  )
}
