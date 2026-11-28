import type { Metadata } from "next"
import Link from "next/link"
import { Code, DocHeader, Pager, Section, TokenTable } from "@/site/doc"
import { Stage } from "@/site/examples"
import { metaFor, neighbours } from "@/site/foundations"
import { blockHref } from "@/site/block-types"
import { Inline, Rules, textLink } from "@/site/prose"

export const metadata: Metadata = metaFor("permissions-and-data-states")

const item = (name: string) => (
  <Link key={name} href={`/docs/components/${name}`} className={`${textLink} font-mono text-xs`}>
    {name}
  </Link>
)

// From least to most of the interface taken away. Each row is the question to ask, in order.
const access = [
  {
    show: "Hidden",
    when: "The viewer can never have this here: another axis's tool (a platform admin's action on a project page), or a feature the plan lacks.",
    how: "Nothing in its place. Never a gap or a placeholder that hints at it.",
    use: "permission-gate `hidden`",
  },
  {
    show: "Disabled, with a reason",
    when: "Someone in their position could be given it: a Member looking at Remove device, which an Admin has.",
    how: "In view, focusable, refused on click; the reason (the permission and who grants it) in a tooltip, on a tap and to screen readers.",
    use: "permission-gate `disabled`",
  },
  {
    show: "Read-only",
    when: "They may read the values but not change them: project settings for a Viewer.",
    how: "Values as text with one line saying it is view only; never fields that look editable.",
    use: "permission-gate `read-only`",
  },
  {
    show: "Forbidden region",
    when: "A part of a page they may open, which needs a further permission to read: the audit log.",
    how: "The region says what is missing and who grants it; the rest of the page works.",
    use: "permission-gate `forbidden`, data-state `forbidden`",
  },
  {
    show: "No access page",
    when: "The whole page needs a permission they lack, inside their own tenant.",
    how: "403: what they cannot open and who can change it, with a way back.",
    use: "status-pages `NoAccessPage`",
  },
  {
    show: "Not found (404)",
    when: "The record is in another tenant, or does not exist. Both answer the same.",
    how: "Never forbidden: a 403 would confirm the record exists to someone outside it.",
    use: "status-pages `NotFoundPage`",
  },
]

const states = [
  { state: "loading", when: "Nothing to show yet: the first fetch.", how: "One line says what is coming; bones take the content's shape. The heading and anything known already stay." },
  { state: "empty", when: "The server's total is 0.", how: "What is missing, why, and the one action that adds it. A search with no match offers to clear it." },
  { state: "error", when: "The fetch failed and there is nothing to show.", how: "Copy from the error's code, the code itself for support, Try again. The message is never shown or parsed." },
  { state: "forbidden", when: "The viewer lacks the read permission for this region.", how: "Which permission, who grants it. No retry: trying again changes nothing." },
  { state: "stale", when: "The data in hand is older than it should be: a refresh failed, or an update has not arrived.", how: "Keep the content; a notice above says how old it is, with Try again." },
  { state: "ready", when: "Fresh data.", how: "The content alone. Calm states stay grey." },
]

const controlled = [
  ["fleet-table", "FleetTableContent"],
  ["users-roles", "UsersRolesContent"],
  ["users-invitations", "UsersInvitationsContent"],
  ["users-audit-log", "UsersAuditLogContent"],
  ["settings-api-keys", "SettingsApiKeysContent"],
  ["settings-webhooks", "SettingsWebhooksContent"],
  ["settings-sessions", "SettingsSessionsContent"],
  ["notification-center", "NotificationCenterContent"],
  ["settings-page", "SettingsPageContent"],
  ["device-enrolment", "DeviceEnrolmentContent"],
  ["device-detail", "DeviceDetailContent"],
  ["offline-licence", "OfflineLicenceContent"],
  ["project-members", "ProjectMembersContent"],
  ["permission-matrix", "PermissionMatrixContent"],
  ["webhook-deliveries", "WebhookDeliveriesContent"],
  ["tenant-admin", "TenantAdminContent"],
  ["platform-health", "PlatformHealthContent"],
  ["status-pages", "NotFoundPage, NoAccessPage, ErrorPage"],
] as const

export default function PermissionsAndDataStatesPage() {
  return (
    <article>
      <DocHeader
        title="Permissions and data states"
        lead="What a screen shows when the viewer may not act, and while its data loads, fails, is empty or grows old. One decision each, so every list, card and button answers the same way."
      />

      <Section id="permissions" title="When the viewer may not" lead="Ask in order: may they ever have it here, could they be given it, may they read it, may they open the page, does it exist for them at all.">
        <TokenTable
          head={["Show", "When", "How", "Use"]}
          rows={access.map((a) => [
            <span key="s" className="font-medium whitespace-nowrap">
              {a.show}
            </span>,
            a.when,
            <span key="h" className="text-muted-foreground">
              {a.how}
            </span>,
            <Inline key="u" text={a.use} />,
          ])}
        />
        <Stage file="permission-gate" name="PermissionGateDisabled" />
      </Section>

      <Section id="permission-rules" title="Permission rules">
        <Rules
          rules={[
            "Decide by permission strings (`devices:delete`), never by a role's name. Roles are bundles that change from product to product; the strings are the contract between the server and the interface.",
            "Two axes, one check: the platform's permissions and the project's come with the session, and `can` looks in both. The interface never works out what a role allows.",
            "Every disabled action says why and who can change it. A greyed button with no reason sends people to support.",
            "Hiding is not security. The server checks every request again; the interface only spares people an action that would fail.",
            "Across tenants, 404 everywhere: the page, the API and the error copy say not found, so a guessed ID learns nothing.",
          ]}
        />
      </Section>

      <Section id="data-states" title="Data states" lead="Every region that fetches is in exactly one of six states. A page never invents its own order of checks: `dataStateOf` picks the state from what the fetch knows.">
        <TokenTable
          head={["State", "When", "Show"]}
          rows={states.map((s) => [
            <Code key="s">{s.state}</Code>,
            s.when,
            <span key="h" className="text-muted-foreground">
              {s.how}
            </span>,
          ])}
        />
        <Stage file="data-state" name="DataStateStale" />
      </Section>

      <Section id="data-rules" title="Data rules">
        <Rules
          rules={[
            "Counts come from the server's `total`, never from `items.length`: a page holds one page of rows, and a server may cap them. A tab's count, a heading's count and a metric all read `total` or a summary endpoint.",
            "Lists the server pages share one query, `page`, `limit`, `sortBy`, `order` and `search`, kept in the URL, so a filtered view is a link. A new search or sort goes back to page 1.",
            "Errors are read by their machine code (the envelope's `error.code`), never by their message. Each code a product knows has its own sentence; any other falls back to one general sentence with the code beside it.",
            "An error with data in hand is stale, not an error: never replace what someone is reading with a failure panel.",
            "Forbidden wins over every other state: a region the viewer may not read does not first load, then fail.",
            "Colour only for a problem. Ready and loading are grey; stale takes the warning tint, an error its icon. The status rules of the Colour foundation apply.",
          ]}
        />
      </Section>

      <Section id="step-up" title="Sensitive actions" lead="When the server asks for a fresh check (ELEVATED_SESSION_REQUIRED), the action waits, the person proves it is them, and the action runs. They never press it twice.">
        <Stage file="step-up-dialog" name="UseStepUpReplay" />
      </Section>

      <Section id="components" title="Components">
        <TokenTable
          head={["Item", "For"]}
          rows={[
            [item("permission-gate"), "Hidden, disabled with a reason, read-only or forbidden, by permission string."],
            [item("data-state"), "Loading, empty, error by code, forbidden, stale and ready, with `dataStateOf`."],
            [item("list-query"), "The list query grammar and `ListPage<T>`: parse and serialise URLSearchParams."],
            [item("use-list-query"), "That query kept in the URL, with search debounce and page reset."],
            [item("step-up-dialog"), "The check itself: a code or the password through your `verify()`."],
            [item("use-step-up"), "Holds the action on a step-up code and replays it after the check."],
          ].map(([a, b]) => [a, <Inline key="b" text={b as string} />])}
        />
      </Section>

      <Section
        id="controlled-blocks"
        title="Blocks that take them"
        lead="These blocks export a `…Content` that renders only from props: a page and its `total`, the query out through `onQueryChange`, a data state, `can`, callbacks that return promises, and `labels`."
      >
        <TokenTable
          head={["Block", "Content"]}
          rows={controlled.map(([name, content]) => [
            <Link key="b" href={blockHref(name)} className={`${textLink} font-mono text-xs`}>
              {name}
            </Link>,
            <Code key="c">{content}</Code>,
          ])}
        />
      </Section>

      <Pager {...neighbours("permissions-and-data-states")} />
    </article>
  )
}
