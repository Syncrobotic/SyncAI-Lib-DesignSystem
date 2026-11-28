import type { AreaNav } from "./scopes"

// The drawer's areas. The page's own area is here as soon as its sidebar has rendered; the others come from /nav.json,
// asked for once the drawer may be opened (a phone's first idle moment, or a touch on its button).
const areas = new Map<string, AreaNav>()
const listeners = new Set<() => void>()
let loading: Promise<void> | null = null
let version = 0

const emit = () => {
  version += 1
  listeners.forEach((l) => l())
}

export const subscribeNav = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const navVersion = () => version
export const areaOf = (key: string) => areas.get(key)

/** An area a page already holds (its sidebar), so the drawer opens on it without a request. */
export function rememberArea(area: AreaNav) {
  if (areas.has(area.key)) return
  areas.set(area.key, area)
  emit()
}

/** Every area, once; a failed request is tried again on the next call. */
export function loadNav() {
  loading ??= fetch("/nav.json")
    .then((r) => (r.ok ? (r.json() as Promise<AreaNav[]>) : Promise.reject(new Error(String(r.status)))))
    .then((all) => {
      for (const a of all) areas.set(a.key, a)
      emit()
    })
    .catch(() => {
      loading = null
    })
  return loading
}
