// @syncrobotic/cn v0.5.0 · update: npx shadcn add @syncrobotic/cn --overwrite
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
