"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as m from "motion/react-m"
import { cn } from "@/lib/utils"
import type { Scope } from "./scopes"

/** Header area links. The marker of the area you are in slides to the new one: a selection moving is a state change. */
export function HeaderNav({ links }: { links: Pick<Scope, "key" | "label" | "href" | "match">[] }) {
  const path = usePathname()
  const current = links.findIndex((s) => s.match.some((m) => path === m || path.startsWith(`${m}/`)))
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 text-sm lg:flex">
      {links.map((l, i) => (
        <Link
          key={l.key}
          href={l.href}
          aria-current={i === current ? "page" : undefined}
          className={cn(
            "press relative flex h-(--h-sm) items-center rounded-xs px-3 transition-colors duration-(--motion-fast) ease-(--ease-standard)",
            i === current ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {i === current && <m.span layoutId="header-nav-marker" aria-hidden className="absolute inset-0 rounded-xs bg-muted" />}
          <span className="relative">{l.label}</span>
        </Link>
      ))}
    </nav>
  )
}
