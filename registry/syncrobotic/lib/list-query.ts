// @syncrobotic/list-query v0.55.0 · update: npx shadcn add @syncrobotic/list-query --overwrite
/**
 * The query a server-paged list sends (page, limit, sortBy, order, search) and the page it gets back (items, total),
 * read from and written to URLSearchParams. The URL, the request and a server render share this one grammar. Counts
 * come from `total`, never from `items.length`: the items are one page.
 */

export type SortOrder = "asc" | "desc"

/** One page's request. `page` starts at 1. */
export type ListQuery = {
  page: number
  limit: number
  sortBy?: string
  order?: SortOrder
  search?: string
}

/** One page of a list: its rows, and how many match in all (the server's count, never `items.length`). */
export type ListPage<T> = { items: T[]; total: number }

/** The URL keys of each field, when a product's URL names them differently (`{ search: "q" }`). */
export type ListQueryKeys = Record<keyof ListQuery, string>

export type ListQueryOptions = {
  /** Page and limit when the URL has none; the serialiser leaves values equal to these out of the URL. */
  defaults?: { page?: number; limit?: number; sortBy?: string; order?: SortOrder }
  /** The largest limit a URL may ask for (100). A larger one falls back to the default. */
  maxLimit?: number
  /** The columns the server sorts by. A `sortBy` outside them is dropped, so a hand-edited URL cannot ask for others. */
  sortable?: readonly string[]
  keys?: Partial<ListQueryKeys>
}

export const defaultListQuery = { page: 1, limit: 20 } as const

const keysOf = (o?: ListQueryOptions): ListQueryKeys => ({ page: "page", limit: "limit", sortBy: "sortBy", order: "order", search: "search", ...o?.keys })

/** A query string, URLSearchParams, or a framework's `searchParams` object (a key may hold several values). */
export type ListQueryInput = string | URLSearchParams | Record<string, string | string[] | undefined>

function toParams(input: ListQueryInput): URLSearchParams {
  if (typeof input === "string" || input instanceof URLSearchParams) return new URLSearchParams(input)
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(input)) for (const one of Array.isArray(v) ? v : v === undefined ? [] : [v]) params.append(k, one)
  return params
}

const whole = (raw: string | null, min: number, max: number) => {
  if (raw === null || !/^\d+$/.test(raw.trim())) return undefined
  const n = Number(raw)
  return n >= min && n <= max ? n : undefined
}

/** Reads a query from the URL. Anything malformed falls back to the defaults, so a bad link still opens a page. */
export function parseListQuery(input: ListQueryInput, options?: ListQueryOptions): ListQuery {
  const p = toParams(input)
  const k = keysOf(options)
  const d = options?.defaults
  const maxLimit = options?.maxLimit ?? 100
  const sortBy = p.get(k.sortBy)?.trim() || d?.sortBy
  const order = p.get(k.order)
  const search = p.get(k.search)?.trim()
  return {
    page: whole(p.get(k.page), 1, Number.MAX_SAFE_INTEGER) ?? d?.page ?? defaultListQuery.page,
    limit: whole(p.get(k.limit), 1, maxLimit) ?? d?.limit ?? defaultListQuery.limit,
    ...(sortBy && (!options?.sortable || options.sortable.includes(sortBy)) ? { sortBy } : {}),
    ...(order === "asc" || order === "desc" ? { order } : d?.order ? { order: d.order } : {}),
    ...(search ? { search } : {}),
  }
}

/**
 * Writes a query into URLSearchParams. With `base`, every other key in it (a status filter, a tab) is kept. Values equal
 * to the defaults are left out, so the first page of an unfiltered list has a clean URL; `complete: true` writes every
 * field, for an API request. `order` goes out only with a `sortBy`.
 */
export function serializeListQuery(query: Partial<ListQuery>, options?: ListQueryOptions & { base?: ListQueryInput; complete?: boolean }): URLSearchParams {
  const p = options?.base ? toParams(options.base) : new URLSearchParams()
  const k = keysOf(options)
  const d = { ...defaultListQuery, ...options?.defaults }
  const all = options?.complete
  const put = (key: string, value: string | number | undefined, fallback?: string | number) => {
    if (value === undefined || value === "" || (!all && value === fallback)) p.delete(key)
    else p.set(key, String(value))
  }
  put(k.page, query.page, d.page)
  put(k.limit, query.limit, d.limit)
  put(k.sortBy, query.sortBy, d.sortBy)
  put(k.order, query.sortBy ? query.order : undefined, d.order)
  put(k.search, query.search?.trim())
  return p
}

/** How many pages `total` rows make at `limit` a page: at least 1, so an empty list still has its first page. */
export function pageCount(total: number, limit: number) {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, limit)))
}

/** The rows a page shows, 1-based, for "21–40 of 135": `{ from: 0, to: 0 }` when there are none. */
export function pageRange(query: Pick<ListQuery, "page" | "limit">, total: number) {
  if (total <= 0) return { from: 0, to: 0 }
  const from = Math.min((query.page - 1) * query.limit + 1, total)
  return { from, to: Math.min(query.page * query.limit, total) }
}

/** The query on its last page when it asks for one past the end (rows were deleted, or a stale link). */
export function clampPage<Q extends Pick<ListQuery, "page" | "limit">>(query: Q, total: number): Q {
  const last = pageCount(total, query.limit)
  return query.page > last ? { ...query, page: last } : query
}
