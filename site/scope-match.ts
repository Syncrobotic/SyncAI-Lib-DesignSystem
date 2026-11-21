// A scope's match entry covers its own page and the pages under it; "/docs" is the docs' front page only, since every
// area lives under it. Kept apart from scopes.ts so the client header can use it without the catalog.
export const inScope = (m: string, path: string) => path === m || (m !== "/docs" && path.startsWith(`${m}/`))
