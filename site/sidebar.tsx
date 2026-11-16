"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export type NavGroup = { title: string; links: { href: string; label: string }[] }

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const path = usePathname()
  return (
    <nav className="flex flex-col gap-6 text-sm">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">{g.title}</p>
          {g.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xs px-3 py-1.5 hover:bg-accent",
                path === l.href ? "bg-accent font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  )
}
