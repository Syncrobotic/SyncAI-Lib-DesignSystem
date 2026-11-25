"use client" // Error boundaries are Client Components.

import * as React from "react"
import { GeistSans } from "geist/font/sans"
import { RotateCw } from "lucide-react"
import { StatusPage } from "@/registry/syncrobotic/blocks/status-pages"
import { applyTheme, themeScript } from "./theme-script"
import "./globals.css"

// Shown when the root layout throws. error.tsx sits inside the root layout, so it cannot catch it; this replaces the
// layout, so it brings what the layout gave every page: <html> and <body>, the font, the styles and the theme.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  // In production an error from the server arrives without its message, only a digest that matches the server's log.
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : undefined

  React.useEffect(() => {
    console.error(error) // or send it to your error reporting
  }, [error])
  // React gives this <html> only its own attributes, which drops the class the script added (after a server error at
  // hydration, after a browser error when it swaps the layout out), and an inline script does not run again: put it back.
  React.useLayoutEffect(applyTheme, [])

  return (
    // The script sets the class before React hydrates; suppressHydrationWarning: <html> differs from the server's HTML.
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* No metadata export in an error boundary: React's <title> names the tab. */}
        <title>Something went wrong</title>
        <StatusPage
          icon={RotateCw}
          code="500"
          title="Something went wrong"
          body={
            digest ? (
              <>
                Try again. If it keeps happening, send support this reference: <span className="font-mono text-foreground">{digest}</span>
              </>
            ) : (
              "Try again. If it keeps happening, tell support what you were doing."
            )
          }
          // retry() fetches and renders the page again; a plain link reloads the app from the start.
          primary={{ label: "Try again", onClick: retry }}
          secondary={{ label: "Go to overview", href: "/" }}
        />
      </body>
    </html>
  )
}
