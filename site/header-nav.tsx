"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Scope } from "./scopes"

/** Header area links; the one you are in is marked. */
export function HeaderNav({ links }: { links: Pick<Scope, "key" | "label" | "href" | "match">[] }) {
  const path = usePathname()
  const current = links.findIndex((s) => s.match.some((m) => path === m || path.startsWith(`${m}/`)))
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 text-sm sm:flex">
      {links.map((l, i) => (
        <Link
          key={l.key}
          href={l.href}
          aria-current={i === current ? "page" : undefined}
          className={cn("rounded-xs px-3 py-1.5", i === current ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
