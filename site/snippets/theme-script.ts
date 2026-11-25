// The theme, put on <html> before the first paint. The root layout and global-error both render it as an inline script,
// first in <body>; global-error also calls it after it mounts. Light is the default: "dark", or "system" on a dark
// system, adds the class (the same rule as the theme switch in the Next.js guide).
export function applyTheme() {
  try {
    const t = localStorage.getItem("theme")
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  } catch {}
}

// The function's own source, called at once: one rule for the script and the effect. It reads nothing from the module
// around it, so its text runs on its own.
export const themeScript = `(${applyTheme.toString()})()`
