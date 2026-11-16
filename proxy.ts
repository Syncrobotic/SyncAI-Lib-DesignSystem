import { NextResponse, type NextRequest } from "next/server"

// Locked until the design system is open-sourced. Two ways in:
//   - people: HTTP Basic auth, any user name, password = SITE_PASSWORD
//   - shadcn CLI: Authorization: Bearer REGISTRY_TOKEN, only under /r/
// SITE_PUBLIC=true removes the lock (and lets search engines index the site, see site/config.ts).
// No matcher on purpose: /_next/static holds the compiled components, so it stays behind the same lock.
// Browsers resend Basic credentials for every request to the same site after the first prompt.

const REALM = 'Basic realm="SYNCROBOTIC Design System", charset="UTF-8"'

function same(a: string, b: string) {
  // Constant-time compare, so response timing does not leak the secret.
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function basicPassword(header: string) {
  if (!header.startsWith("Basic ")) return null
  try {
    const decoded = atob(header.slice(6))
    const i = decoded.indexOf(":")
    return i < 0 ? null : decoded.slice(i + 1)
  } catch {
    return null
  }
}

export function proxy(request: NextRequest) {
  if (process.env.SITE_PUBLIC === "true") return NextResponse.next()

  const sitePassword = process.env.SITE_PASSWORD
  const registryToken = process.env.REGISTRY_TOKEN

  if (!sitePassword || !registryToken) {
    // Local `next dev` works without secrets. A deployment without them stays closed.
    if (process.env.NODE_ENV === "development") return NextResponse.next()
    return new NextResponse("SITE_PASSWORD or REGISTRY_TOKEN is not set.", { status: 503 })
  }

  const header = request.headers.get("authorization") ?? ""
  const isRegistry = request.nextUrl.pathname.startsWith("/r/")

  if (isRegistry && header.startsWith("Bearer ") && same(header.slice(7), registryToken)) {
    return NextResponse.next()
  }

  const password = basicPassword(header)
  if (password !== null && same(password, sitePassword)) return NextResponse.next()

  return new NextResponse(isRegistry ? "REGISTRY_TOKEN required." : "Sign in required.", {
    status: 401,
    headers: isRegistry ? {} : { "WWW-Authenticate": REALM },
  })
}
