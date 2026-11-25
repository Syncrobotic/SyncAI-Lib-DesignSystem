import type { Metadata } from "next"
import * as React from "react"
import Link from "next/link"
import registry from "../../../../../registry.json"
import { blockHref } from "@/site/block-types"
import { items, readSource } from "@/site/catalog"
import { CodeBlock } from "@/site/code-block"
import { pageMeta, site } from "@/site/config"
import { Pager } from "@/site/doc"
import { startNeighbours } from "@/site/foundations"
import { H2, Inline, PageTitle, Rules } from "@/site/prose"

const description =
  "Use the SYNCROBOTIC kit in a Next.js App Router project: server and client components, the theme without a flash, next/link, the app shell in a layout, route progress, forms and images."

export const metadata: Metadata = pageMeta({ title: "Next.js", description, path: "/docs/nextjs" })

// Every snippet below was built and run in a Next.js 16 app with the kit installed (tsc, next build, and a browser).

const componentsJson = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "zinc", "cssVariables": true },
  "aliases": { "components": "@/components", "ui": "@/components/ui", "lib": "@/lib", "utils": "@/lib/utils", "hooks": "@/hooks" },
  "iconLibrary": "lucide",
  "registries": {
    "@syncrobotic": { "url": "${site.registryUrl}/r/{name}.json" }
  }
}`

const globals = `@import "tailwindcss";
@import "../styles/syncrobotic-theme.css";

/* Your own dark: classes follow the class the theme switches on, not the OS setting. */
@custom-variant dark (&:where(.dark, .dark *));

/* next/font serves Geist under a generated name: put it first in the theme's font stack. */
:root {
  --font-sans: var(--font-geist-sans), "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
}`

const layout = `import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

export const metadata: Metadata = { title: "Fleet console" }

// Runs while the HTML is parsed, before the first paint. Light is the default; "dark", or "system" on a dark system, adds
// the class. The same rule as ThemeSwitch below.
const themeScript = \`try{var t=localStorage.getItem("theme");if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}\`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script changes the class before React hydrates; suppressHydrationWarning lets <html> keep it.
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}`

const themeSwitch = `"use client"

import * as React from "react"
import { ThemeToggle, type ThemeChoice } from "@/components/ui/theme-toggle"

const media = "(prefers-color-scheme: dark)"

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem("theme")
    return t === "dark" || t === "system" ? t : "light"
  } catch {
    return "light"
  }
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia(media).matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function ThemeSwitch() {
  // The stored choice is known only in the browser: undefined on the server, so nothing shows as chosen until then.
  const [choice, setChoice] = React.useState<ThemeChoice | undefined>(undefined)
  React.useLayoutEffect(() => {
    const stored = read()
    apply(stored) // in development, Strict Mode's remount resets <html> to its JSX attributes; put the class back
    setChoice(stored)
  }, [])
  // "Match system" follows the system live.
  React.useEffect(() => {
    if (choice !== "system") return
    const mq = window.matchMedia(media)
    const follow = () => apply("system")
    mq.addEventListener("change", follow)
    return () => mq.removeEventListener("change", follow)
  }, [choice])

  return (
    <ThemeToggle
      value={choice}
      onValueChange={(next) => {
        setChoice(next)
        apply(next)
        try {
          localStorage.setItem("theme", next)
        } catch {}
      }}
    />
  )
}`

const sitesPage = `import { ChipGroup } from "@/components/ui/chip-group"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { Tree, type TreeNode } from "@/components/ui/tree"
import { NavLink } from "@/components/nav-link"

// No "use client": the page reads its data on the server. ChipGroup and Tree are client components already; they get
// plain data and a link component, nothing else.
export default async function SitesPage({ searchParams }: { searchParams: Promise<{ zone?: string }> }) {
  const { zone = "all" } = await searchParams
  const sites: TreeNode[] = [
    {
      id: "north",
      label: "North depot",
      meta: "12 robots",
      children: [
        { id: "north-a", label: "Aisle A", href: "/sites/north/a", meta: "7" },
        { id: "north-b", label: "Aisle B", href: "/sites/north/b", meta: "5" },
      ],
    },
  ]
  return (
    <div className="flex flex-col gap-6">
      <MetricGrid>
        <MetricCard label="Robots online" value="12" unit="/ 14" caption="2 docked for charging" href="/robots" linkAs={NavLink} />
        <MetricCard label="Open incidents" value="3" delta="+2" trend="bad" href="/incidents" linkAs={NavLink} />
      </MetricGrid>
      {/* Chips with href are links: the filter lives in the URL, so the page reads it from searchParams. */}
      <ChipGroup
        label="Zone"
        value={zone}
        items={[
          { value: "all", label: "All zones", href: "/sites" },
          { value: "loading", label: "Loading bays", count: 4, href: "/sites?zone=loading" },
          { value: "cold", label: "Cold store", count: 2, href: "/sites?zone=cold" },
        ]}
        linkAs={NavLink}
      />
      <Tree label="Sites" items={sites} expandAll linkAs={NavLink} />
    </div>
  )
}`

const appLayout = `import { AppFrame } from "./app-frame"

// A Server Component: it renders the client frame and passes the page through as children, which stays server-rendered.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>
}`

const appFrame = `"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bot, CalendarDays, LayoutDashboard, Map } from "lucide-react"
import { AppShell, type AppNavGroup } from "@/components/app-shell"
import { NavLink } from "@/components/nav-link"
import { ThemeSwitch } from "@/components/theme-switch"

// Icons are components (functions), and functions cannot be sent from a Server Component: the nav lives here.
const nav: AppNavGroup[] = [
  {
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Robots", href: "/robots", icon: Bot },
      { label: "Sites", href: "/sites", icon: Map },
      { label: "Missions", href: "/missions/new", icon: CalendarDays },
    ],
  },
]
const items = nav.flatMap((g) => g.items)

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The nav item this page is under: /sites/north matches /sites.
  const here = items.find((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/")))
  return (
    <AppShell
      product="Fleet console"
      logo={<Image src="/logo.svg" alt="" width={28} height={28} />}
      nav={nav}
      current={here?.href}
      title={here?.label ?? "Fleet console"}
      linkAs={NavLink}
      actions={<ThemeSwitch />}
    >
      {children}
    </AppShell>
  )
}`

const navLink = `"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link, { useLinkStatus } from "next/link"
import { RouteProgress } from "@/components/ui/route-progress"

// useLinkStatus reads the <Link> it sits in: pending from the click until the new page is in. The bar is portalled to
// <body>, so it is not part of the link's text or its accessible name.
function Pending() {
  const { pending } = useLinkStatus()
  return pending ? createPortal(<RouteProgress active />, document.body) : null
}

/** next/link with the kit's route progress. Pass it as \`linkAs\` to the app shell, a tree or a metric card. */
export function NavLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <Pending />
    </Link>
  )
}`

const actions = `"use server"

import type { MissionValues } from "@/components/form"

// A refusal is a return value: an error thrown here reaches the browser without its message in production.
export async function saveMission(values: MissionValues): Promise<{ error?: string }> {
  if (values.name.toLowerCase().includes("test")) return { error: "A mission named “test” already exists on this site." }
  // … write it to your API or database
  return {}
}`

const newMission = `"use client"

import { useRouter } from "next/navigation"
import { MissionForm } from "@/components/form"
import { saveMission } from "./actions"

export function NewMission() {
  const router = useRouter()
  return (
    <MissionForm
      onSave={async (values) => {
        const { error } = await saveMission(values)
        if (error) throw new Error(error) // MissionForm shows it above the fields and keeps what was typed
        router.push("/missions")
      }}
    />
  )
}`

const localTime = `// The locale and the time zone are written down, so the server and the browser format the same text. Show a robot's
// times in its site's zone: that is the clock the people on site read.
export function LocalTime({ iso, timeZone, locale = "en-GB" }: { iso: string; timeZone: string; locale?: string }) {
  const text = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso))
  return <time dateTime={iso}>{text}</time>
}`

const handlerError = `Error: Event handlers cannot be passed to Client Component props.
  <... label="Zone" items={[...]} onValueChange={function onValueChange}>
                                                ^^^^^^^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.`

const hookError = `Error: You're importing a module that depends on \`useState\` into a React Server Component module. This API is only available in Client Components. To fix, mark the file (or its parent) with the \`"use client"\` directive.`

// ---------- Read from the registry, so the lists stay true ----------

type RegistryItem = { name: string; type: string; files: { path: string }[] }
const HEADER = /^(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*/
const startsClient = (path: string) => /^["']use client["']/.test(readSource(path).replace(HEADER, "").trimStart())

// The components that have a page, by whether their file starts with "use client" (the same test as lint:registry).
const components = items
  .filter((i) => i.group !== "Hooks & libraries")
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((i) => ({ name: i.name, client: (i as unknown as RegistryItem).files.some((f) => /\.tsx?$/.test(f.path) && startsClient(f.path)) }))
const clientNames = components.filter((c) => c.client).map((c) => c.name)
const serverNames = components.filter((c) => !c.client).map((c) => c.name)
const blocks = (registry.items as RegistryItem[]).filter((i) => i.type === "registry:block")
const clientBlocks = blocks.filter((b) => b.files.some((f) => /\.tsx$/.test(f.path) && startsClient(f.path))).length

// Every item with a linkAs prop, read from its source.
const withLinkAs = (registry.items as RegistryItem[])
  .filter((i) => i.files.some((f) => /\.tsx$/.test(f.path) && /\blinkAs\?:/.test(readSource(f.path))))
  .map((i) => ({ name: i.name, href: i.type === "registry:block" ? blockHref(i.name) : `/docs/components/${i.name}` }))

// A list of a hundred names, each a link in mono: the links are styled from the list, once, rather than each carrying the
// same classes (in the markup and again in the page's React payload).
const codeLinks =
  "max-w-3xl text-sm leading-7 text-muted-foreground [&_a]:whitespace-nowrap [&_a]:font-mono [&_a]:text-sm [&_a]:underline [&_a]:decoration-muted-foreground [&_a]:underline-offset-4 [&_a]:hover:decoration-foreground"

function Names({ names }: { names: string[] }) {
  return (
    <p className={codeLinks}>
      {names.map((n, i) => (
        <React.Fragment key={n}>
          <Link href={`/docs/components/${n}`}>{n}</Link>
          {i < names.length - 1 && ", "}
        </React.Fragment>
      ))}
    </p>
  )
}

function P({ text, className = "pb-3" }: { text: string; className?: string }) {
  return (
    <p className={`max-w-3xl text-base ${className}`}>
      <Inline text={text} />
    </p>
  )
}

function Stack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

export default function NextjsPage() {
  return (
    <article>
      <PageTitle
        title="Next.js"
        lead="The kit in a Next.js App Router project: keep pages and layouts on the server, and let the kit's interactive parts hydrate where they are used."
      />

      <H2 id="setup">Set up</H2>
      <P text="Follow the installation steps, with this `components.json`. Keep `rsc: true`: it tells the CLI the project uses React Server Components, so the `&quot;use client&quot;` line at the top of interactive files stays in." />
      <CodeBlock code={componentsJson} lang="json" title="components.json" />
      <div className="pt-4">
        <Rules
          rules={[
            "Components land in `components/ui`, robot-shell parts and blocks in `components`, hooks in `hooks`, `cn` in `lib/utils.ts` and the theme in `styles/syncrobotic-theme.css`.",
            "Import them as `@/components/ui/button`, `@/components/app-shell`. Every file starts with its item and version; see Versions and upgrades.",
          ]}
        />
      </div>

      <H2 id="theme">Theme and fonts</H2>
      <P text="Import the theme after Tailwind and delete the `:root`, `.dark` and `@theme inline` blocks that `shadcn init` wrote. The theme names Geist first; serve it from your app with `next/font` (this site uses the `geist` package: `npm install geist`), never from a CDN." />
      <Stack>
        <CodeBlock code={globals} lang="css" title="app/globals.css" />
        <CodeBlock code={layout} lang="tsx" title="app/layout.tsx" />
      </Stack>
      <P className="pt-3" text={'`next/font/google` works the same way: `Geist({ subsets: ["latin"], variable: "--font-geist-sans" })`, and its `.variable` on `<html>`.'} />

      <H2 id="server-client">Server and client components</H2>
      <P text="Pages and layouts stay Server Components: they fetch data and render. Do not add `&quot;use client&quot;` to a page to use a kit component. The kit's interactive components already start with `&quot;use client&quot;`, so you import them into a server page as they are, and only they ship JavaScript." />
      <Rules
        rules={[
          "Pass them data: strings, numbers, arrays and plain objects, React elements as children, and a link component (`linkAs`).",
          "Never a function from a server file: an `onValueChange`, an `onSelect`, a Lucide icon in a nav item or tree node (icons are components). Move that part into a small file of your own that starts with `\"use client\"` and pass it the data.",
          "A Server Function (`\"use server\"`) can be passed; the Forms section below shows one.",
        ]}
      />
      <h3 className="pt-6 pb-2 text-base font-medium">Client components ({clientNames.length})</h3>
      <Names names={clientNames} />
      <h3 className="pt-6 pb-2 text-base font-medium">Render on the server too ({serverNames.length})</h3>
      <Names names={serverNames} />
      <P className="pt-3" text={`The kit's hooks are for client files only. Of the ${blocks.length} blocks, ${clientBlocks} are client components: they hold state. Either way, import them into a server page as they are.`} />

      <H2 id="theme-toggle">Theme without a flash</H2>
      <P text="The stored theme is only known in the browser. The inline script in the root layout above adds `dark` to `<html>` while the page is parsed, before anything paints; the switch reads the same key and keeps it in step. Mount it once, in the app shell's actions." />
      <CodeBlock code={themeSwitch} lang="tsx" title="components/theme-switch.tsx" />
      <P className="pt-3" text="Put the script in `<body>`, first, not in a hand-written `<head>`: on this site that made hydration fail now and then. Light is the products' default; teleoperation screens put `class=&quot;dark&quot;` on their own root and stay dark." />

      <H2 id="links">Links: next/link through linkAs</H2>
      <P text="Kit parts that render links take your router's link as `linkAs` and default to a plain `<a>`. Pass `next/link` (or the NavLink below, which adds route progress) and navigation stays client-side, with prefetching." />
      <p className={`pb-4 ${codeLinks}`}>
        {withLinkAs.map((i, n) => (
          <React.Fragment key={i.name}>
            <Link href={i.href}>{i.name}</Link>
            {n < withLinkAs.length - 1 && ", "}
          </React.Fragment>
        ))}
      </p>
      <CodeBlock code={sitesPage} lang="tsx" title="app/(app)/sites/page.tsx" />
      <div className="pt-4">
        <Rules
          rules={[
            "A button that navigates: `<Button asChild><Link href=\"/missions/new\">New mission</Link></Button>`.",
            "`BreadcrumbLink` renders its own `<a>`: a crumb loads the page in full. `Pagination` builds its links from an `href` function, so in a server page render it from a client file of your own.",
          ]}
        />
      </div>

      <H2 id="app-shell">The app shell in a layout</H2>
      <P text="The layout stays on the server and renders a client frame around the page. The frame holds what cannot cross from the server: the nav with its icons, the current page from `usePathname`, and the link component." />
      <Stack>
        <CodeBlock code={appLayout} lang="tsx" title="app/(app)/layout.tsx" />
        <CodeBlock code={appFrame} lang="tsx" title="app/(app)/app-frame.tsx" />
      </Stack>
      <P className="pt-3" text="The page inside is still a Server Component: a layout passes it to the frame as `children`, already rendered." />

      <H2 id="route-progress">Route progress</H2>
      <P text="`RouteProgress` shows a thin blue bar while the next page loads, only after 300 ms. In the App Router, drive it from `useLinkStatus`, which reports a pending navigation of the `<Link>` it sits in. Pages that are prefetched or have a `loading.tsx` arrive at once and show no bar, which is right." />
      <CodeBlock code={navLink} lang="tsx" title="components/nav-link.tsx" />

      <H2 id="forms">Forms</H2>
      <P text="Start from the `form` example: React Hook Form and zod drawn with the kit's Field, installed with `npx shadcn add @syncrobotic/form`. `MissionForm` is a client component. Save through a Server Function that returns a refusal instead of throwing it, and turn it into an error in a small client file." />
      <Stack>
        <CodeBlock code={actions} lang="ts" title="app/(app)/missions/new/actions.ts" />
        <CodeBlock code={newMission} lang="tsx" title="app/(app)/missions/new/new-mission.tsx" />
      </Stack>
      <P className="pt-3" text="The page (`page.tsx`) stays a Server Component that renders `<NewMission />`." />
      <p className="max-w-3xl text-base">
        <Link href="/docs/components/form" className="underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          The form example
        </Link>{" "}
        <Inline text="covers the rest: errors after the first submit, focus on the first field in error, and a button that waits." />
      </p>

      <H2 id="images">Images</H2>
      <Rules
        rules={[
          "`ImageGrid`, `AnnotatedImage`, `Attachment` and `AvatarImage` draw a plain `<img>` with the URL you give, lazily loaded. They show your users' data (camera frames, uploads), often from signed storage URLs: give them a thumbnail-sized URL from your storage or image service.",
          "Use `next/image` for your own pictures: the logo in the app shell (its `logo` takes any element, as in the frame above), a marketing hero, an empty-state illustration.",
          "Pictures from another host need that host in `images.remotePatterns` in `next.config.ts`.",
        ]}
      />

      <H2 id="error-pages">Error pages</H2>
      <P text="Draw `not-found.tsx`, `error.tsx` and `global-error.tsx` with the status-pages block (`NotFoundPage`, `ErrorPage`, `StatusPage`). An error in the root layout skips every `error.tsx`, which sit inside it, and reaches only `app/global-error.tsx`: that file renders its own `<html>` and `<body>`, so it brings the font, `globals.css` and the theme script itself." />
      <p className="max-w-3xl text-base">
        <Link href="/blocks/states#nextjs" className="underline decoration-muted-foreground underline-offset-4 hover:decoration-foreground">
          The global-error recipe
        </Link>{" "}
        <Inline text="is on the status pages, with the theme script both files share." />
      </p>

      <H2 id="errors">Common errors</H2>
      <h3 className="pt-2 pb-2 text-base font-medium">Hydration mismatch</h3>
      <P text="The server's HTML and the browser's first render differ. The usual causes:" />
      <Rules
        rules={[
          "A date or number formatted without a locale and time zone (`toLocaleString()`, `Intl.DateTimeFormat()`): the server formats in its own (usually UTC, en-US), the browser in the user's. Write both down, or format on the server only.",
          "A time that moves (`Date.now()`, “3 min ago”): render it once on the server, or in a client component after mount; for a live clock, `suppressHydrationWarning` on its `<time>`.",
          "`localStorage` or `window` read during render: read it in an effect (as ThemeSwitch does) and pass `undefined` until then.",
          "The theme class on `<html>`: expected, so `<html>` carries `suppressHydrationWarning`.",
        ]}
      />
      <div className="pt-4">
        <CodeBlock code={localTime} lang="tsx" title="components/local-time.tsx" />
      </div>
      <h3 className="pt-6 pb-2 text-base font-medium">Missing &quot;use client&quot;</h3>
      <P text="A file of yours uses a hook or an event handler but has no `&quot;use client&quot;` line. Add it at the top of that file, or move the interactive part into a new file that has it. Kit files carry it already; if one has lost it, `components.json` has `rsc: false`." />
      <CodeBlock code={hookError} lang="bash" title="Build output" />
      <h3 className="pt-6 pb-2 text-base font-medium">A function passed from the server</h3>
      <P text="A server page passed a handler (or an icon, which is a component) to a kit client component. Move that part into a client file, as the app frame above does." />
      <CodeBlock code={handlerError} lang="bash" title="Server output" />

      <Pager {...startNeighbours("/docs/nextjs")} />
    </article>
  )
}
