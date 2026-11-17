import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { site } from "@/site/config"
import { MotionProvider } from "@/site/motion-provider"
import { themeScript } from "@/site/theme-toggle"
import { color } from "@/site/theme-tokens"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: site.keywords,
  authors: [{ name: "SYNCROBOTIC", url: site.repo }],
  creator: "SYNCROBOTIC",
  publisher: "SYNCROBOTIC",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  robots: site.public
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  category: "technology",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: color("background").dark },
    { media: "(prefers-color-scheme: light)", color: color("background").light },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        {/* Before anything paints. Not in a hand-written <head>: that made hydration fail intermittently (React error 418). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
