import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FleetTableContent, sampleRobots } from "@/registry/syncrobotic/blocks/fleet-table"
import { UsersRolesContent, type MemberRole } from "@/registry/syncrobotic/blocks/users-roles"
import { UsersInvitationsContent, type Invitation } from "@/registry/syncrobotic/blocks/users-invitations"
import { UsersAuditLogContent } from "@/registry/syncrobotic/blocks/users-audit-log"
import { SettingsApiKeysContent, type ApiKey } from "@/registry/syncrobotic/blocks/settings-api-keys"
import { SettingsWebhooksContent, sampleEndpoints, webhookEvents } from "@/registry/syncrobotic/blocks/settings-webhooks"
import { SettingsSessionsContent, sampleSessions } from "@/registry/syncrobotic/blocks/settings-sessions"
import { NotificationCenterContent, NotificationPanelContent, sampleNotifications, sampleNow } from "@/registry/syncrobotic/blocks/notification-center"
import { SettingsPageContent } from "@/registry/syncrobotic/blocks/settings-page"
import { StepUpCancelledError } from "@/registry/syncrobotic/hooks/use-step-up"
import { permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"

afterEach(cleanup)

const flush = () => act(async () => {})
const page = <T,>(items: T[], total: number) => ({ items, total })
const apiError = (code: string) => Object.assign(new Error("server words, never shown"), { error: { code } })
const openMenu = (name: string) => fireEvent.keyDown(screen.getAllByRole("button", { name })[0]!, { key: "Enter" })

describe("FleetTableContent", () => {
  const query = { page: 1, limit: 2 }

  it("counts and pages from the server's total and counts, never the rows in hand", () => {
    render(<FleetTableContent page={page(sampleRobots.slice(0, 2), 135)} query={query} onQueryChange={() => {}} counts={{ all: 135, offline: 3 }} />)
    expect(screen.getByText("1–2 of 135")).toBeTruthy()
    expect(screen.getByRole("radio", { name: "All 135" })).toBeTruthy()
    expect(screen.getByRole("radio", { name: "Offline 3" })).toBeTruthy()
    // A segment the summary does not count shows no number rather than one counted from the page.
    expect(screen.getByRole("radio", { name: "Active" })).toBeTruthy()
  })

  it("sends a search back to page 1, and a sort with its order", () => {
    const onQueryChange = vi.fn()
    render(
      <FleetTableContent page={page(sampleRobots.slice(0, 2), 40)} query={{ ...query, page: 3 }} onQueryChange={onQueryChange} sortable={["name"]} searchDelay={0} />,
    )
    fireEvent.change(screen.getByRole("searchbox", { name: "Search robots" }), { target: { value: "dock" } })
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, limit: 2, search: "dock" })
    fireEvent.click(screen.getAllByRole("button", { name: /Robot/ })[0]!)
    expect(onQueryChange).toHaveBeenLastCalledWith({ page: 1, limit: 2, sortBy: "name", order: "asc" })
  })

  it("words an error by its code, never its message, and retries", () => {
    const onRetry = vi.fn()
    render(<FleetTableContent page={page([], 0)} query={query} onQueryChange={() => {}} state="error" error={{ code: "RATE_LIMITED", message: "raw" }} onRetry={onRetry} />)
    expect(screen.getByText(/Too many requests in a short time/)).toBeTruthy()
    expect(screen.getByText("Code: RATE_LIMITED")).toBeTruthy()
    expect(screen.queryByText("raw")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("forbidden hides the search and the list", () => {
    render(<FleetTableContent page={page(sampleRobots, 8)} query={query} onQueryChange={() => {}} state="forbidden" />)
    expect(screen.getAllByText("You do not have access to this").length).toBeGreaterThan(0)
    expect(screen.queryByText("Patrol dog 7F3A")).toBeNull()
  })

  it("disables Remove with the reason for a viewer without devices:write", async () => {
    const onRemove = vi.fn(() => Promise.resolve())
    render(
      <FleetTableContent page={page(sampleRobots.slice(0, 1), 1)} query={query} onQueryChange={() => {}} can={permissionsFrom(["devices:read"])} onRemove={onRemove} />,
    )
    openMenu("More actions for Patrol dog 7F3A")
    const remove = await screen.findByRole("menuitem", { name: /Remove from fleet/ })
    expect(remove.getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText(/You need the devices:write permission/).length).toBeGreaterThan(0)
    fireEvent.click(remove)
    expect(onRemove).not.toHaveBeenCalled()
  })

  it("hides Remove instead when asked", () => {
    render(
      <FleetTableContent page={page(sampleRobots.slice(0, 1), 1)} query={query} onQueryChange={() => {}} can={() => false} denied="hidden" onRemove={() => Promise.resolve()} />,
    )
    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull()
  })
})

const roles: MemberRole[] = [
  { id: "owner", name: "Owner", permissions: ["members:write", "project:delete"] },
  { id: "admin", name: "Admin", permissions: ["members:write"] },
  { id: "viewer", name: "Viewer", permissions: [] },
]

describe("UsersRolesContent", () => {
  const members = page(
    [
      { id: "a", name: "Mei Lin", email: "mei@example.com", roleId: "owner" },
      { id: "b", name: "Kai Chen", email: "kai@example.com", roleId: "viewer" },
    ],
    57,
  )

  it("says how many people from the server's total", () => {
    render(<UsersRolesContent members={members} roles={roles} onRoleChange={() => Promise.resolve()} />)
    expect(screen.getByText("57 people can sign in to this site.")).toBeTruthy()
  })

  it("never lets anyone give or take a role above their own", () => {
    render(<UsersRolesContent members={members} roles={roles} can={permissionsFrom(["members:write"])} onRoleChange={() => Promise.resolve()} />)
    // The owner's role holds project:delete, which this admin lacks: it is text with the reason, not a select.
    expect(screen.queryByRole("combobox", { name: "Role of Mei Lin" })).toBeNull()
    expect(screen.getByText(/Their role holds permissions you do not have/)).toBeTruthy()
    const select = screen.getByRole("combobox", { name: "Role of Kai Chen" })
    fireEvent.keyDown(select, { key: "Enter" })
    expect(screen.getByRole("option", { name: "Owner" }).getAttribute("aria-disabled")).toBe("true")
    expect(screen.getByRole("option", { name: "Admin" }).getAttribute("aria-disabled")).toBeNull()
  })

  it("reads roles without members:write, with the reason", () => {
    render(<UsersRolesContent members={members} roles={roles} can={() => false} onRoleChange={() => Promise.resolve()} onInvite={() => Promise.resolve()} />)
    expect(screen.queryAllByRole("combobox")).toHaveLength(0)
    expect(screen.getByRole("button", { name: "Invite" }).getAttribute("aria-disabled")).toBe("true")
  })

  it("words a failed change by its code; a cancelled step-up says nothing", async () => {
    const onRoleChange = vi.fn().mockRejectedValueOnce(apiError("LAST_OWNER")).mockRejectedValueOnce(new StepUpCancelledError())
    render(<UsersRolesContent members={members} roles={roles} onRoleChange={onRoleChange} labels={{ errors: { LAST_OWNER: "A project keeps one owner." } }} />)
    const pick = async () => {
      fireEvent.keyDown(screen.getByRole("combobox", { name: "Role of Kai Chen" }), { key: "Enter" })
      fireEvent.click(screen.getByRole("option", { name: "Admin" }))
      await flush()
    }
    await pick()
    expect(screen.getByText("A project keeps one owner.")).toBeTruthy()
    await pick()
    expect(screen.queryByText("A project keeps one owner.")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("UsersInvitationsContent", () => {
  const now = new Date("2026-11-20T10:00:00Z")
  const items: Invitation[] = [
    { id: "1", email: "a@example.com", roleId: "viewer", invitedBy: "Mei", sentAt: "2026-11-19T10:00:00Z", expiresAt: "2026-11-27T10:00:00Z" },
    { id: "2", email: "b@example.com", roleId: "viewer", invitedBy: "Mei", sentAt: "2026-11-01T10:00:00Z", expiresAt: "2026-11-08T10:00:00Z" },
  ]

  it("counts from total and writes dates through Intl, in the reader's language", () => {
    render(<UsersInvitationsContent invitations={page(items, 12)} roles={roles} now={now} timeZone="UTC" onInvite={() => Promise.resolve()} />)
    expect(screen.getByText("12")).toBeTruthy()
    expect(screen.getByText("in 7 days")).toBeTruthy()
    expect(screen.getByText("Expired 8 Nov")).toBeTruthy()
    cleanup()
    render(<UsersInvitationsContent invitations={page(items, 12)} roles={roles} now={now} timeZone="UTC" locale="zh-TW" labels={zh.usersInvitationsLabels} onInvite={() => Promise.resolve()} />)
    expect(screen.getByText("7 天後")).toBeTruthy()
  })

  it("offers only the roles the viewer may give", () => {
    render(<UsersInvitationsContent invitations={page([], 0)} roles={roles} can={permissionsFrom(["members:write"])} onInvite={() => Promise.resolve()} />)
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" })
    expect(screen.queryByRole("option", { name: "Owner" })).toBeNull()
    expect(screen.getByRole("option", { name: "Admin" })).toBeTruthy()
  })

  it("is read-only without members:write", () => {
    render(<UsersInvitationsContent invitations={page(items, 2)} roles={roles} can={() => false} onInvite={() => Promise.resolve()} onRevoke={() => Promise.resolve()} />)
    expect(screen.getByText(/View only/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Send invitation" }).closest("fieldset")?.disabled).toBe(true)
    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull()
  })
})

describe("UsersAuditLogContent", () => {
  const entries = page([{ id: "1", at: "2026-11-17T06:02:00Z", actor: "Mei Lin", kind: "access", action: "Changed role", target: "Kai Chen" }], 240)

  it("counts entries from total, and is forbidden without audit-logs:read", () => {
    const { rerender } = render(<UsersAuditLogContent entries={entries} query={{ page: 1, limit: 20 }} onQueryChange={() => {}} timeZone="UTC" />)
    expect(screen.getByText("240 entries")).toBeTruthy()
    expect(screen.getAllByText("17 Nov, 06:02").length).toBeGreaterThan(0)
    rerender(<UsersAuditLogContent entries={entries} query={{ page: 1, limit: 20 }} onQueryChange={() => {}} can={() => false} />)
    expect(screen.queryByText("Changed role")).toBeNull()
    expect(screen.queryByRole("searchbox")).toBeNull()
  })

  it("a filter goes back to page 1", () => {
    const onQueryChange = vi.fn()
    const onFiltersChange = vi.fn()
    render(
      <UsersAuditLogContent
        entries={entries}
        query={{ page: 4, limit: 20 }}
        onQueryChange={onQueryChange}
        onFiltersChange={onFiltersChange}
        kinds={[{ value: "access", label: "Access" }]}
      />,
    )
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Kind of action" }), { key: "Enter" })
    fireEvent.click(screen.getByRole("option", { name: "Access" }))
    expect(onFiltersChange).toHaveBeenCalledWith({ kind: "access" })
    expect(onQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20 })
  })
})

describe("SettingsApiKeysContent", () => {
  const keys: ApiKey[] = [{ id: "k", name: "Warehouse", prefix: "sk_7f3a", createdAt: "2026-03-03T00:00:00Z", scopes: ["robots:read"] }]
  const scopes = [{ value: "robots:read" }, { value: "members:write" }]
  const now = new Date("2026-11-20T00:00:00Z")

  it("bounds scopes by allowedScopes, sends the expiry as ISO, and shows the secret once from the result", async () => {
    const onCreate = vi.fn(() => Promise.resolve({ secret: "sk_live_new_secret" }))
    render(<SettingsApiKeysContent keys={page(keys, 1)} scopes={scopes} allowedScopes={["robots:read"]} now={now} onCreate={onCreate} onRevoke={() => Promise.resolve()} />)
    fireEvent.click(screen.getByRole("button", { name: "Create key" }))
    expect(screen.getByText(/Not in your own permissions/)).toBeTruthy()
    expect((screen.getByRole("checkbox", { name: /^members:write/ }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("checkbox", { name: /^robots:read/ }))
    fireEvent.change(screen.getByLabelText("Key name"), { target: { value: "Nightly export" } })
    fireEvent.submit(screen.getByLabelText("Key name").closest("form")!)
    await flush()
    expect(onCreate).toHaveBeenCalledWith({ name: "Nightly export", scopes: ["robots:read"], expiresAt: "2027-02-18T00:00:00.000Z" })
    fireEvent.click(screen.getByRole("button", { name: "Show value" }))
    expect(document.body.textContent).toContain("sk_live_new_secret")
    fireEvent.click(screen.getByRole("button", { name: "Done, I have copied it" }))
    expect(document.body.textContent).not.toContain("sk_live_new_secret")
  })

  it("keeps the form when the step-up is cancelled, and words a refusal by code", async () => {
    const onCreate = vi.fn().mockRejectedValueOnce(new StepUpCancelledError()).mockRejectedValueOnce(apiError("FORBIDDEN_SCOPE"))
    render(<SettingsApiKeysContent keys={page(keys, 1)} scopes={scopes} now={now} onCreate={onCreate} onRevoke={() => Promise.resolve()} />)
    fireEvent.click(screen.getByRole("button", { name: "Create key" }))
    fireEvent.change(screen.getByLabelText("Key name"), { target: { value: "X" } })
    const form = screen.getByLabelText("Key name").closest("form")!
    fireEvent.submit(form)
    await flush()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByLabelText("Key name")).toBeTruthy()
    fireEvent.submit(form)
    await flush()
    expect(screen.getByRole("alert").textContent).toMatch(/above your own permissions/)
  })

  it("disables Create key with the reason without apikeys:write", () => {
    render(<SettingsApiKeysContent keys={page(keys, 1)} scopes={scopes} can={() => false} onCreate={vi.fn()} onRevoke={vi.fn()} />)
    expect(screen.getByRole("button", { name: /Create key/ }).getAttribute("aria-disabled")).toBe("true")
    expect(screen.getAllByText(/apikeys:write/).length).toBeGreaterThan(0)
  })
})

describe("SettingsWebhooksContent", () => {
  it("shows the selected endpoint's deliveries from its page, and the rotated secret once", async () => {
    const onRotateSecret = vi.fn(() => Promise.resolve({ secret: "whsec_rotated" }))
    render(
      <SettingsWebhooksContent
        endpoints={page(sampleEndpoints, 3)}
        events={webhookEvents}
        deliveries={page(sampleEndpoints[0]!.deliveries!, 4)}
        onCreate={vi.fn()}
        onRotateSecret={onRotateSecret}
        now={new Date("2026-11-20T15:30:00+08:00")}
        timeZone="Asia/Taipei"
      />,
    )
    expect(screen.getByText("since Today, 09:15 · Last error: 503 Service Unavailable")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Rotate secret" }))
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Rotate secret" }))
    await flush()
    expect(screen.getByText("Copy the new signing secret now")).toBeTruthy()
  })

  it("has a deliveries state of its own", () => {
    render(
      <SettingsWebhooksContent endpoints={page(sampleEndpoints, 3)} events={webhookEvents} deliveriesState="error" deliveriesError={{ code: "NETWORK_ERROR" }} onCreate={vi.fn()} />,
    )
    expect(screen.getByText(/We could not reach the server/)).toBeTruthy()
    expect(screen.getAllByRole("list", { name: "Endpoints" })).toHaveLength(1)
  })
})

describe("SettingsSessionsContent", () => {
  it("counts the other browsers from total, and a cancelled step-up signs nobody out", async () => {
    const onSignOutOthers = vi.fn().mockRejectedValue(new StepUpCancelledError())
    render(
      <SettingsSessionsContent
        sessions={page(sampleSessions.slice(0, 2), 9)}
        onSignOut={vi.fn()}
        onSignOutOthers={onSignOutOthers}
        now={new Date("2026-11-20T15:30:00+08:00")}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Sign out all other browsers" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByRole("heading", { name: "Sign out of 8 browsers?" })).toBeTruthy()
    fireEvent.click(within(dialog).getByRole("button", { name: "Sign out 8 browsers" }))
    await flush()
    expect(onSignOutOthers).toHaveBeenCalledOnce()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByText("Active 2 hours ago")).toBeTruthy()
  })
})

describe("NotificationCenterContent", () => {
  it("the bell says the server's unread count, not the page's", () => {
    render(<NotificationCenterContent page={page(sampleNotifications.slice(0, 1), 40)} unread={17} onMarkRead={vi.fn()} now={sampleNow} />)
    expect(screen.getByRole("button", { name: "Notifications, 17 unread" })).toBeTruthy()
  })

  it("marks all on the server and loads more while the page holds fewer than total", async () => {
    const onMarkAllRead = vi.fn(() => Promise.resolve())
    const onLoadMore = vi.fn()
    render(
      <NotificationPanelContent
        page={page(sampleNotifications, 40)}
        unread={17}
        onMarkRead={vi.fn()}
        onMarkAllRead={onMarkAllRead}
        onLoadMore={onLoadMore}
        now={sampleNow}
        timeZone="Asia/Taipei"
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }))
    await flush()
    expect(onMarkAllRead).toHaveBeenCalledOnce()
    expect(screen.getByText("17 marked as read")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /more/ }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})

describe("SettingsPageContent", () => {
  const values = { name: "North site", timeZone: "Asia/Taipei" }
  const zones = [{ value: "Asia/Taipei", label: "Taipei" }]

  it("is read-only without project:write, and Delete says what it needs", () => {
    render(<SettingsPageContent values={values} timeZones={zones} onSave={vi.fn()} onDelete={vi.fn()} can={() => false} />)
    expect(screen.getByText(/View only/)).toBeTruthy()
    expect((screen.getByLabelText("Site name") as HTMLInputElement).closest("fieldset")?.disabled).toBe(true)
    expect(screen.getByRole("button", { name: "Delete site" }).getAttribute("aria-disabled")).toBe("true")
  })

  it("saves through onSave and words a refusal by code", async () => {
    const onSave = vi.fn().mockRejectedValue(apiError("NAME_TAKEN"))
    render(<SettingsPageContent values={values} timeZones={zones} onSave={onSave} labels={{ errors: { NAME_TAKEN: "Another site has that name." } }} />)
    fireEvent.change(screen.getByLabelText("Site name"), { target: { value: "South site" } })
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))
    await flush()
    expect(onSave).toHaveBeenCalledWith({ name: "South site", timeZone: "Asia/Taipei" })
    expect(screen.getByRole("alert").textContent).toBe("Another site has that name.")
  })
})
