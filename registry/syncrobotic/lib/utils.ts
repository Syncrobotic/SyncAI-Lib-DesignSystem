// @syncrobotic/cn v0.53.0 · update: npx shadcn add @syncrobotic/cn --overwrite
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Joins class names with clsx and lets the later Tailwind class win with tailwind-merge, shipped in this registry so it
 * installs on an intranet too.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
