import Link from "next/link"
import { cn } from "@/lib/utils"

/** The two views of the icons: the kit's set and every Lucide icon. Links, so each has its own URL. */
export function IconTabs({ current }: { current: "kit" | "lucide" }) {
  const tabs = [
    { key: "kit", href: "/icons", label: "Kit icons" },
    { key: "lucide", href: "/icons/lucide", label: "All Lucide" },
  ] as const
  return (
    <nav aria-label="Icon lists" className="flex gap-6 border-b border-border">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={cn(
            "-mb-px flex h-(--h-md) items-center border-b-2 text-sm transition-colors duration-(--motion-fast) ease-(--ease-standard)",
            t.key === current ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
