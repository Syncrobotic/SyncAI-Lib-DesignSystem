import type { Metadata } from "next"
import Link from "next/link"
import { Download, X } from "lucide-react"
import { pageMeta } from "@/site/config"
import { H2, PageTitle } from "@/site/prose"
import { BrandMark, Logo, LogoMark } from "@/site/logo"
import { SiteFooter } from "@/site/site-footer"
import { PageTransition } from "@/site/page-transition"
import { cn } from "@/lib/utils"

export const metadata: Metadata = pageMeta({
  title: "Brand assets",
  description: "The SYNCROBOTIC logo, logomark and logotype in every colour, the brand colours, and how to show them in web and app interfaces.",
  path: "/brand",
})

type Colour = "black" | "grey" | "indigo" | "white"
const COLOURS: Colour[] = ["black", "grey", "indigo", "white"]

// The kit's own lockups, as exported from the brand file (public/brand, regenerated from the Illustrator source).
const lockups: { id: string; title: string; use: string; file: string; colours: Colour[]; aspect: string }[] = [
  { id: "horizontal", title: "Logo, horizontal", use: "The default: sign-in pages, marketing pages, documents, anywhere there is room for the name on one line.", file: "logo/syncrobotic-logo-horizontal", colours: COLOURS, aspect: "aspect-[2000/700]" },
  { id: "stacked", title: "Logo, stacked", use: "Square or tall spaces: a splash screen, a poster, the centre of an empty page.", file: "logo/syncrobotic-logo-stacked", colours: COLOURS, aspect: "aspect-[2000/1200]" },
  { id: "stacked-compact", title: "Logo, stacked, compact", use: "Where the S leads and the name is a caption: a booth, a sticker, an about dialog.", file: "logo/syncrobotic-logo-stacked-compact", colours: COLOURS, aspect: "aspect-[2000/1800]" },
  { id: "logomark", title: "Logomark", use: "The S on its own: the product header, small spaces, once the name is already on screen.", file: "logomark/syncrobotic-logomark", colours: COLOURS, aspect: "aspect-square" },
  { id: "logotype", title: "Logotype", use: "The name on its own, when the S is already on screen (a footer beside the mark, a slide header).", file: "logotype/syncrobotic-logotype", colours: ["black", "white"], aspect: "aspect-[2000/600]" },
]

// The brand colours, read from the brand kit's files. tokens-ok: brand colours, shown as data.
const brandColours = [
  // tokens-ok: a brand colour from the brand kit, shown as data
  { name: "Indigo", hex: "#5347a8", note: "The brand's one colour. In the interface it is also the one colour charts use; elsewhere colour stays for status." },
  // tokens-ok: a brand colour from the brand kit, shown as data
  { name: "Grey", hex: "#515353", note: "A quieter logo on light surfaces, where black would shout." },
  // tokens-ok: a brand colour from the brand kit, shown as data
  { name: "Black", hex: "#000000", note: "The default logo on light surfaces." },
  // tokens-ok: a brand colour from the brand kit, shown as data
  { name: "White", hex: "#ffffff", note: "The logo on dark surfaces and photographs." },
]

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((hi + 0.05) / (lo + 0.05)).toFixed(1)
}

const linkClass = "inline-flex min-h-(--h-sm) items-center gap-1 text-sm underline-offset-4 hover:underline"
// Links are underlined foreground; hover darkens the underline, not the colour.
const pageLink = "inline-flex min-h-(--h-sm) items-center text-sm underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground"

function Tile({ dark, className, children }: { dark?: boolean; className?: string; children: React.ReactNode }) {
  return (
    // A dark tile is a dark-theme subtree, so the kit's own dark tokens apply inside it.
    <div className={cn("flex items-center justify-center rounded-md border border-border p-6", dark ? "dark bg-background text-foreground" : "bg-card", className)}>{children}</div>
  )
}

export default function BrandPage() {
  return (
    <PageTransition>
      <main id="content" className="mx-auto max-w-6xl px-4 pt-8 pb-section">
        <PageTitle
          title="Brand assets"
          lead="The SYNCROBOTIC logo in every form and colour, the brand colours, and how to show them in web and app interfaces. Use these files as they are; never redraw them."
        />
        <a
          href="/brand/syncrobotic-brand-assets.zip"
          download
          className="press inline-flex h-(--h-md) items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Download aria-hidden="true" className="size-4" />
          Download all (ZIP, SVG and PNG, with the Illustrator source)
        </a>

        <H2 id="logos">Logos</H2>
        <p className="max-w-3xl pb-6 text-sm text-muted-foreground">
          Black on light surfaces, white on dark ones and on photographs. Grey and indigo where the page asks for something quieter or
          for the brand&apos;s colour. SVG for the web and documents, PNG (2048 px) where SVG is not accepted.
        </p>
        <div className="flex flex-col gap-8">
          {lockups.map((l) => (
            <section key={l.id} id={l.id} aria-labelledby={`${l.id}-title`} className="grid scroll-mt-20 gap-4 lg:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-2">
                <h3 id={`${l.id}-title`} className="font-bold">
                  {l.title}
                </h3>
                <p className="text-sm text-muted-foreground">{l.use}</p>
                <ul className="flex flex-col pt-2" aria-label={`${l.title} downloads`}>
                  {l.colours.map((c) => (
                    <li key={c} className="flex items-center gap-3 text-sm">
                      <span className="w-16 text-muted-foreground capitalize">{c}</span>
                      <a href={`/brand/${l.file}-${c}.svg`} download className={linkClass}>
                        SVG
                      </a>
                      <a href={`/brand/${l.file}-${c}.png`} download className={linkClass}>
                        PNG
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Tile>
                  <img src={`/brand/${l.file}-black.svg`} alt={`${l.title}, black`} className={cn("max-h-40 w-full object-contain", l.aspect)} />
                </Tile>
                <Tile dark>
                  <img src={`/brand/${l.file}-white.svg`} alt={`${l.title}, white`} className={cn("max-h-40 w-full object-contain", l.aspect)} />
                </Tile>
              </div>
            </section>
          ))}
        </div>

        <H2 id="colours">Colours</H2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Brand colours">
          {brandColours.map((c) => (
            <li key={c.name} className="overflow-hidden rounded-md border border-border bg-card">
              <div className="h-24 border-b border-border" style={{ background: c.hex }} />
              <div className="flex flex-col gap-1 p-4 text-sm">
                <span className="font-bold">{c.name}</span>
                <span className="font-mono text-muted-foreground">{c.hex}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {/* tokens-ok: white and the dark page, the two surfaces the contrast is measured on */}
                  {c.hex === "#ffffff" ? `${ratio(c.hex, "#09090b")}:1 on the dark page` : `${ratio(c.hex, "#ffffff")}:1 on white`}
                </span>
                <span className="pt-1 text-muted-foreground">{c.note}</span>
              </div>
            </li>
          ))}
        </ul>

        <H2 id="interface">In web and app interfaces</H2>
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="header-title" className="flex flex-col gap-3">
            <h3 id="header-title" className="font-bold">
              The product header
            </h3>
            <Tile className="justify-start">
              <Logo />
            </Tile>
            <Tile dark className="justify-start">
              <Logo />
            </Tile>
            <p className="text-sm text-muted-foreground">
              The logomark at 24 px high, then the product&apos;s name in Geist bold, 8 px apart. The mark follows the text colour:
              black in light mode, white in dark mode. The company name is already in the mark, so the header names the product.
            </p>
          </section>
          <section aria-labelledby="icon-title" className="flex flex-col gap-3">
            <h3 id="icon-title" className="font-bold">
              Favicon, app icon and avatar
            </h3>
            <Tile className="gap-6">
              <LogoMark className="size-4" title="" />
              <LogoMark className="size-8" title="" />
              <LogoMark className="size-16" title="" />
            </Tile>
            <p className="text-sm text-muted-foreground">
              Below 24 px, and wherever a platform crops to a square or a circle (browser tab, home screen, social avatar), the S sits
              on its disc, so it reads at 16 px and keeps its shape when cropped. In a browser tab the disc sits on a dark tile whose
              corners are 22 % of its side, as the{" "}
              <Link href="/docs/foundations/radius#brand" className="underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
                Radius foundation
              </Link>{" "}
              shows. The disc version is not a logo for pages.{" "}
              <a href="/brand/syncrobotic-mark.svg" download className="underline underline-offset-4">
                Download the disc (SVG)
              </a>
            </p>
          </section>
          <section aria-labelledby="sign-in-title" className="flex flex-col gap-3">
            <h3 id="sign-in-title" className="font-bold">
              Sign-in and splash screens
            </h3>
            <Tile className="flex-col gap-4 py-8">
              <img src="/brand/logo/syncrobotic-logo-horizontal-black.svg" alt="SYNCROBOTIC" className="w-40" />
              <span className="text-sm text-muted-foreground">Sign in to Fleet console</span>
            </Tile>
            <p className="text-sm text-muted-foreground">
              The horizontal logo, 160 px wide, centred above the form; on a splash screen, the stacked logo in the middle. Never
              both a logo and a separate company name.
            </p>
          </section>
          <section aria-labelledby="space-title" className="flex flex-col gap-3">
            <h3 id="space-title" className="font-bold">
              Clear space and smallest size
            </h3>
            <Tile className="py-8">
              {/* The clear space drawn as a dashed box half the S's height away from it on every side. */}
              <div className="relative p-6 outline-1 outline-muted-foreground outline-dashed">
                <BrandMark title="" className="h-12" />
                <span className="absolute -top-6 left-0 font-mono text-xs text-muted-foreground">½ × height</span>
              </div>
            </Tile>
            <p className="text-sm text-muted-foreground">
              Keep half the S&apos;s height clear on every side; nothing (text, edge, another logo) comes closer. Smallest sizes: the
              logomark 20 px high in an interface, the horizontal logo 96 px wide. Smaller than that, use the disc.
            </p>
          </section>
        </div>

        <H2 id="dont">Don&apos;t</H2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Misuses">
          {[
            { t: "Recolour it", d: "Only black, white, grey and indigo.", el: <BrandMark title="" className="h-16 fill-warning" /> },
            { t: "Stretch or squash it", d: "Scale it whole.", el: <BrandMark title="" className="h-16 scale-x-150" /> },
            { t: "Rotate or tilt it", d: "It stands upright.", el: <BrandMark title="" className="h-16 -rotate-12" /> },
            { t: "Add effects", d: "No shadow, outline, gradient or glow.", el: <BrandMark title="" className="h-16 drop-shadow-lg" /> },
            {
              t: "Put it on a busy picture",
              d: "Use white on a calm, dark part of a photo, or a solid panel.",
              el: (
                <div
                  className="flex size-full items-center justify-center"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--muted) 0 8px, var(--border) 8px 16px)" }}
                >
                  <BrandMark title="" className="h-16" />
                </div>
              ),
            },
            { t: "Set the name in another font", d: "Use the logotype file; never type SYNCROBOTIC as the logo.", el: <span className="font-serif text-2xl tracking-widest">SYNCROBOTIC</span> },
          ].map((m) => (
            <li key={m.t} className="flex flex-col gap-2">
              <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-md border border-border bg-card">
                {m.el}
                <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-xs bg-danger-subtle text-danger">
                  <X aria-hidden="true" className="size-4" />
                </span>
              </div>
              <p className="text-sm">
                <span className="font-bold">{m.t}.</span> <span className="text-muted-foreground">{m.d}</span>
              </p>
            </li>
          ))}
        </ul>

        <H2 id="icons">Icons</H2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-6">
            <span className="font-bold">Interface icons</span>
            <p className="text-sm text-muted-foreground">
              Lucide, with the meanings the kit has given its icons (stop, dock, mission, battery), and robot pictograms.
            </p>
            {/* A page on this site: an underlined link, no outward arrow (that marks leaving the site). */}
            <Link href="/icons" className={cn(pageLink, "w-fit")}>
              Open the icons
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </PageTransition>
  )
}
