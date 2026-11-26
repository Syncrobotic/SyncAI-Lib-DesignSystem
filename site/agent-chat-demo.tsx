"use client"

import * as React from "react"
import { AgentChat, AgentChatSheet } from "@/registry/syncrobotic/blocks/agent-chat"

const subscribe = () => () => {}
const sheetAsked = () => new URLSearchParams(window.location.search).get("variant") === "sheet"

/**
 * agent-chat's preview: the page by default; `?variant=sheet` shows the copilot instead, open on load without taking the
 * page's focus, as the other sheets' previews do. The server renders the page; the browser switches after hydration.
 */
export function AgentChatDemo() {
  const sheet = React.useSyncExternalStore(subscribe, sheetAsked, () => false)
  return sheet ? <AgentChatSheet defaultOpen focusOnOpen={false} /> : <AgentChat />
}
