// Blocks are compositions: several components put together for one job, as a section of a page or a whole screen.
// Application: the screens and sections any app is built from. Solutions: whole working screens for one job in robot
// operations. A set of variants of ONE component (a line chart, a timeline, a dialog) is not a block: it is that
// component's patterns, shown on the component's page (`home`), as ReUI shows charts on its Chart page. Those sets keep
// their install names and previews; only where they are documented changes.

export const blockGroups = ["Application", "Solutions"] as const
export type BlockGroup = (typeof blockGroups)[number] | "Patterns"

export type BlockType = {
  slug: string
  title: string
  group: BlockGroup
  /** For a set of one component's variants: the component whose page shows them, under "Patterns". */
  home?: string
  /** One line for cards and the page header. */
  description: string
  use: string[]
  instead?: string[]
  rules?: string[]
}

export const blockTypes: BlockType[] = [
  // Application
  {
    slug: "app-shell",
    title: "App shell",
    group: "Application",
    description: "The frame of a tool: navigation, top bar, search and the user, around whatever page you put in it.",
    use: [
      "Internal tools and consoles with more than a handful of pages.",
      "A site or tool that only needs a top bar.",
      "A page that leads to one next step, such as a batch to review or a model to train: the action rail.",
      "A full-screen workspace with a history on one side and the controls for the next run on the other, such as a model playground: the action rail with `leading` and `panel`.",
    ],
    instead: ["A single screen with no navigation: start from a Solutions block."],
    rules: [
      "One shell per product. Pages change inside it; the shell does not.",
      "The current page is marked in the navigation and named in the top bar.",
      "On phones the sidebar becomes a drawer; nothing is hidden for good. The drawer floats 8 px from the edges, the shell's gutter.",
      "A top bar over plain content starts on the content's edge and, on scroll, gathers into a floating panel as wide as the content column.",
      "The logo goes home (`home`), `<main>` has an id for a skip link (`mainId`, \"main\"), and following a link in the phone drawer closes it, on any router.",
      "Each shell sets `--shell-top`, its bar's bottom edge, and `--shell-surface`: a sticky tab row (`TabsList sticky`) or a filter bar pins there, under the bar.",
      "The action rail holds only the next step: one large primary button and a few small actions, never filters or facts. On phones it is a bar fixed above the safe area, and the page is padded so it never covers content.",
      "← and Esc go back up a level wherever there is a back button, except while typing or when an overlay is open.",
      "A full-screen workspace is the action rail with `leading` and `panel`: a history left of the content from 1280 px, the fields for the next step right of it from 1024 px with the rail pinned at their foot. The page does not scroll there; each column does, under a head row of one height (`ActionRailColumnHeader` gives the content the same row), 8 px apart. On phones the fields follow the content and the rail is the bar at the bottom; to read picture, fields, then results on a phone, put the results in `panel` after the fields there and keep only the picture in `main` (`lg:hidden` / `max-lg:hidden`).",
      "Below 1280 px the leading column is not shown: put a top-bar button in `actions` that opens a Sheet with the same list (`xl:hidden`).",
      "A top bar never wraps. Items that may not fit go in `headerItems`, in priority order: the last folds first into a ⋯ menu (More); `actions` never fold, so keep them to the key action. A status item (engine ready, offline) carries its StatusGlyph as `icon`, so it keeps its shape in the menu too: status is a shape and a word, never the word alone.",
      "Keys in the action rail: `←` or `Esc` go back (not while typing or with an overlay open); `Tab` reaches the top bar, then the leading column, the content and the panel with the rail last; on ⋯, `Enter`, `Space` or `↓` open the menu, `↑` `↓` move, `Enter` chooses and `Esc` closes it and returns to ⋯.",
    ],
  },
  {
    slug: "stats",
    title: "Stats",
    group: "Application",
    description: "Headline numbers with their change, under any active alarms.",
    use: ["Under the alarms at the top of an overview page.", "A row of KPIs above a table or a chart."],
    instead: ["A trend beside every row of a list: Data visualisation (sparkline).", "A whole overview screen: Solutions › Fleet operations."],
    rules: ["Four numbers at most in a row.", "Only a change for the worse gets colour (decided by whether it is bad, not by its direction); good news stays neutral.", "Every number has a unit and a time range."],
  },
  {
    slug: "data-table",
    title: "Data table",
    group: "Application",
    description: "Rows to search, filter, page through and act on, written once as a table that phones read as a list.",
    use: ["A fleet, a list of jobs or datasets: many things compared by the same few fields.", "A section of a page, under its header and the numbers."],
    instead: ["A whole screen built around one list: Solutions › Fleet operations.", "A few things people pick from: Card."],
    rules: [
      "One list of columns (ResponsiveTable): a table where there is room, a list on a phone with the name, its state and one or two facts.",
      "Narrow by one attribute with a SegmentedControl when two to four choices cover the list, each count after its word; a search beside it at the same height.",
      "Nothing matches: the header stays and one spanning cell says why, with the way back (Clear filters).",
      "A row's ⋯ menu is DropdownMenuMoreTrigger at its end; a section never stops a robot itself: the screen it sits in carries the stop.",
    ],
  },
  {
    slug: "data-visualisation",
    title: "Data visualisation",
    group: "Application",
    description: "Numbers drawn without a chart library: sparklines in rows, status strips, rings and heatmaps.",
    use: [
      "A trend beside every row of a list or table (sparkline).",
      "Histories of states as strips of cells: uptime per day, the last runs of a route, a rollout's stages (status tracker).",
      "One share of a whole that reads at a glance: battery, progress to a goal, capacity (radial).",
      "Two categories crossed, shaded by how much: incidents by time of week, presence by zone (heatmap).",
    ],
    instead: ["Exact values over time, or counts per category: the Chart component's line, area and bar patterns.", "Headline numbers with their week: Stats."],
    rules: [
      "Neutral until a value is abnormal: normal is grey, only degraded, failed, down or low is coloured, and the word says so beside the shape.",
      "Blue only for a stage that is running now.",
      "Sparklines, rings and status strips write their numbers in words too (99.2 % up, 18/20, 14 %); rows that are compared share one scale.",
      "A heatmap is one hue, light to dark (darker always means more), with a legend for the scale, the extreme named in words, and a table view.",
    ],
  },
  {
    slug: "card",
    title: "Card",
    group: "Application",
    description: "One thing summed up in a card: a robot, a site, a mission, with its next actions.",
    use: ["A robot on a phone.", "Grids of things people pick from."],
    instead: ["Many things compared by the same fields: a data grid."],
    rules: ["State first, as a shape and a word.", "One primary action per card."],
  },
  {
    slug: "auth",
    title: "Sign-in",
    group: "Application",
    description: "Getting in: company SSO first, an email link as the fallback, the 2FA code step, and what happens next.",
    use: ["The sign-in page of an internal tool or console.", "The second step after a password: a code from an authenticator app or a recovery code."],
    rules: [
      "The way most people sign in is the first button.",
      "Errors sit under the field they are about and never clear what was typed.",
      "A wrong code says how many tries are left; a pause says how long, and the button counts it down.",
    ],
  },
  {
    slug: "settings",
    title: "Settings",
    group: "Application",
    description: "Sections beside their explanation; switches apply at once, fields collect into a save bar.",
    use: ["Account, site and fleet settings.", "Any page of preferences.", "Plan, usage and invoices, without taking payment details."],
    instead: ["Creating or editing one record: Form."],
    rules: [
      "A switch applies at once; text fields wait for Save.",
      "Say what a setting does next to it, not in a tooltip.",
      "A secret (an API key, a signing secret) is shown once, with a copy button, and says it will not be shown again.",
      "Signed-in sessions are browsers, never devices: a session is a browser's cookie.",
    ],
  },
  {
    slug: "notifications",
    title: "Notifications",
    group: "Application",
    description: "The bell in the top bar: what happened while you were away, grouped by day, read or unread.",
    use: ["Finished missions, ready reports, installed firmware, changes someone else made.", "Anything worth knowing later that needs no action now."],
    instead: [
      "An abnormal condition that needs someone to act (a robot stuck, a battery about to run out, an emergency stop): an alarm, with the Alarm component and the island.",
      "Settings for which events notify whom: Settings (notification matrix).",
    ],
    rules: [
      "Notifications are not alarms. Anything that needs action is an alarm first; it may also leave a notification, never only one.",
      "Unread is a dot and weight, said in words to screen readers, never colour alone.",
      "Each notification says what happened, which robot and site, when, and links to the thing itself.",
      "Esc closes and puts focus back on the bell; arrow keys move through the list.",
    ],
  },
  {
    slug: "form",
    title: "Form",
    group: "Application",
    description: "Create or edit one record: one column, labels above fields, errors in the hint line.",
    use: ["New robot, new site, new mission.", "Editing one record's details."],
    instead: ["Many preferences on one page: Settings.", "A long process in steps: the Stepper component."],
    rules: ["One column.", "On submit, errors appear under their fields and focus moves to the first.", "The primary action names what it does."],
  },
  {
    slug: "states",
    title: "Empty and error states",
    group: "Application",
    description: "Not found, no access, error, offline and loading: what happened, why, and the next step.",
    use: ["Whole-page states of any tool.", "Content panels that can be empty or fail."],
    rules: ["Never a dead end: every state offers the next step.", "Say what still works (robots keep their schedule)."],
  },
  {
    slug: "landing",
    title: "Landing",
    group: "Application",
    description: "The top of a product or marketing page: what it is, who it is for, and the two ways in.",
    use: ["A product page or a site's home."],
    rules: ["One headline, one supporting line, two actions at most."],
  },
  {
    slug: "confirm-destructive",
    title: "Confirm a destructive action",
    group: "Patterns",
    home: "alert-dialog",
    description: "An action that cannot be undone, confirmed by typing the thing's name.",
    use: ["Deleting a robot, a site, a dataset or a key."],
    instead: ["A reversible action: do it and offer Undo in a toast."],
    rules: ["The confirm button repeats the verb and stays disabled until the name matches.", "The destructive button is an outline in danger, never solid red."],
  },
  {
    slug: "dialog",
    title: "Form and share dialogs",
    group: "Patterns",
    home: "dialog",
    description: "A short decision over the page: confirm a deletion, fill three fields, share with people.",
    use: ["Confirming something that cannot be undone.", "A form of three fields or fewer.", "Sharing one thing."],
    instead: ["A form longer than three fields: Form.", "Details you read while using the page: Sheet."],
    rules: [
      "The title is the question or the action; the buttons repeat its verb.",
      "The safe choice is focused first. The destructive one is an outline, never solid red.",
      "Errors keep the dialog open and everything typed in it.",
    ],
  },
  {
    slug: "sheet",
    title: "Detail sheet",
    group: "Patterns",
    home: "sheet",
    description: "A panel over the page, from the side or the bottom: one thing's details without leaving the list.",
    use: ["Details of a row or a map pin without leaving the list."],
    instead: ["A decision that must be answered: Dialog.", "Filters on a phone: FacetsDrawer (Facets › Filters on a phone)."],
    rules: ["On phones from the bottom, on wide screens from the side.", "Actions sit at the bottom, in thumb reach."],
  },
  {
    slug: "filters-on-a-phone",
    title: "Filters on a phone",
    group: "Patterns",
    home: "facets",
    description: "The facets of a list in a bottom sheet from the toolbar's Filters button, the list and its count behind it.",
    use: ["Narrowing a list on a phone by a few questions (state, site)."],
    instead: ["A wide screen: the Facets column beside the list, with the same value.", "One attribute with a few values: a SegmentedControl or ChipGroup above the list."],
    rules: [
      "FacetsDrawer, never a hand-made sheet of checkboxes. Picks apply at once; Done closes the sheet and Clear all empties it.",
      "Each option says how many rows it leaves; beside the list, how many are left of how many, in a polite live region.",
      "Nothing left: an inline EmptyState with Clear filters.",
    ],
  },
  {
    slug: "timeline",
    title: "Activity and audit timelines",
    group: "Patterns",
    home: "timeline",
    description: "Events in time order: what a robot did on its shift, who changed what.",
    use: ["A robot's or a mission's history.", "An audit log of changes."],
    instead: ["Many events to sort and filter by several fields: Solutions › Fleet operations › Event log."],
    rules: [
      "Newest first, grouped by day.",
      "Only an abnormal event is coloured; an audit log is never coloured.",
      "A change shows its value before and after.",
    ],
  },
  {
    slug: "wizard",
    title: "Wizard",
    group: "Application",
    description: "A job done in steps: adding a robot, importing a file.",
    use: ["Setup that must happen in order.", "Imports that need checking before they land."],
    instead: ["A form with no order to it: Form."],
    rules: [
      "Five steps at most, each named by what you do in it.",
      "Each step checks its fields before Next; finished steps can be revisited.",
      "The last button names the result (Add to fleet, Import 3 checkpoints).",
    ],
  },
  // Charts
  {
    slug: "line-chart",
    title: "Line chart",
    group: "Patterns",
    home: "chart",
    description: "Values over time: telemetry, a measurement against its limit, this period against the last.",
    use: ["Speed, temperature, latency, any reading over time.", "Comparing two periods or two sites."],
    instead: ["A count per category: Bar chart.", "A running total or a share of the fleet: Area chart."],
    rules: [
      "One axis. Two measures of different scale are two charts.",
      "A legend for two series or more, and a table view beside the chart.",
      "A limit is a labelled dashed line in text colour, never a status colour.",
    ],
  },
  {
    slug: "area-chart",
    title: "Area chart",
    group: "Patterns",
    home: "chart",
    description: "A quantity over time with weight under it: battery, a running total, how the fleet splits.",
    use: ["One series where the amount matters, not just the shape.", "Parts of a whole over time, stacked."],
    instead: ["Several unrelated series: Line chart."],
    rules: ["Stacked areas only when the parts add up to something real.", "Soft fill (12 %) for one series; stronger for stacks so the layers read."],
  },
  {
    slug: "bar-chart",
    title: "Bar chart",
    group: "Patterns",
    home: "chart",
    description: "Counts per category: grouped, ranked, stacked, and above or below a plan.",
    use: ["Missions per day, stops per cause, hours per site."],
    instead: ["A trend over many points: Line chart.", "The top few counts inside a card or a table cell, no chart library: bar-list."],
    rules: ["Bars start at zero.", "Rounded on the data end only, 2 px apart.", "Long category names: horizontal bars, sorted."],
  },
  {
    slug: "histogram",
    title: "Histogram",
    group: "Patterns",
    home: "chart",
    description: "How one value is spread: battery at docking, mission length, label confidence, counted in equal bins.",
    use: ["Whether most robots dock early or late, and how many cut it close.", "How long missions take, or how sure a model is, across many runs."],
    instead: ["A count per category: Bar chart.", "One value over time: Line chart.", "A single summary number: the median in a metric card."],
    rules: [
      "Equal-width bins that touch, on a number axis with ticks on the bin edges; counts start at zero.",
      "Say where an edge value goes: each bin holds its lower edge, not its upper, and the last holds the maximum (binEqualWidth).",
      "One neutral hue. Colour a range only when it means something people act on (battery below 15 % in warning), and name it in words with its count.",
      "The median as a labelled dashed line, in text colour. A mean only when the spread is symmetric.",
    ],
  },
  // Solutions
  {
    slug: "fleet-operations",
    title: "Fleet operations",
    group: "Solutions",
    description: "Watching and running a fleet: the overview, the live map, robot lists, the event log.",
    use: ["The control room console.", "Supervisors watching several sites."],
    rules: [
      "Active alarms come first, above the numbers and the tables.",
      "Normal is calm: colour only for what needs someone.",
      "The emergency stop is always one tap away and is the only solid red.",
      "Alarms sort by unacknowledged, then priority, then time.",
    ],
  },
  {
    slug: "data-operations",
    title: "Data operations",
    group: "Solutions",
    description: "Robot datasets as a product: the catalog, one dataset's release readiness, the governance to-do, and labels reviewed by keyboard.",
    use: ["Teams that collect, label and release robot data.", "Checking a model's captions or answers one image at a time."],
    rules: [
      "Only restricted tiers are coloured. The tier is the `tier-badge` component, on its own or in these blocks.",
      "Each block's `…Content` (DataCatalogContent, DatasetDetailContent, GovernanceTodoContent) is the page without the sample shell: put it in your own frame.",
      "A release verdict says what blocks it, not just that it is blocked.",
      "A to-do only offers an action the viewer can take: `readOnly` for people who only read it, `onDone` when the app decides what done means.",
      "A review queue answers with single keys (1, 2, 3), shows each key on its button, and undoes with Backspace or ⌘Z / Ctrl+Z. ? lists the keys.",
    ],
  },
  {
    slug: "users-access",
    title: "Users and access",
    group: "Solutions",
    description: "Who can do what: roles changed in place, invitations, removals with undo.",
    use: ["The members page of any console."],
    rules: ["Roles are words people know (Operator, Supervisor), not permission lists.", "Removing someone can be undone for a few seconds."],
  },
  {
    slug: "incidents",
    title: "Incidents",
    group: "Solutions",
    description: "When something goes wrong at a site: the queue of incidents, and one incident from declared to resolved.",
    use: ["Operations teams that own what happens after an alarm."],
    instead: ["A single alarm to acknowledge: the Alarm component."],
    rules: [
      "Unowned first, then by severity, then by age.",
      "Severity is a number and a shape; only the levels that stop or slow work are coloured.",
      "Every state change is an update in the record, with who and when.",
    ],
  },
  {
    slug: "maintenance",
    title: "Maintenance",
    group: "Solutions",
    description: "Keeping robots serviced: what is coming due by hours run, and a work order at the bench.",
    use: ["Fleet technicians and the people who plan their week."],
    rules: [
      "Due by hours run, not only by date.",
      "A robot in maintenance is out of service, and says so, until someone signs it off.",
      "Sign-off stays disabled with the reason until every step is done.",
    ],
  },
  {
    slug: "firmware-rollout",
    title: "Firmware rollout",
    group: "Solutions",
    description: "Updating the fleet in stages: planning a rollout, and watching one run with its gates.",
    use: ["Releasing firmware or maps to many robots."],
    rules: [
      "Stages grow; each is watched before the next.",
      "Gates pause the rollout on their own; pause and roll back are always one click away.",
      "A failed update says the robot still works on its old version, if it does.",
    ],
  },
  {
    slug: "ai-agents",
    title: "AI agents",
    group: "Solutions",
    description: "Agents that plan and summarise for the fleet: their runs, one run step by step, a proposal waiting for a person, and a conversation with the assistant.",
    use: ["Any agent that reads fleet data or proposes changes to robots."],
    rules: [
      "An agent proposes; a person approves anything that moves a robot.",
      "Show what it changes, why, and what it does not know.",
      "Every run can be opened step by step; a failure is never hidden behind a final answer.",
    ],
  },
]

export const getBlockType = (slug: string) => blockTypes.find((t) => t.slug === slug)

// Where each block lives (site/block-types.ts) and how its frame sizes: whole screens keep a screen height, sections
// follow their content. The order here is the order on the type page.
export const placement: Record<string, { type: string; fit: "screen" | "content" }> = {
  "app-shell": { type: "app-shell", fit: "screen" },
  "top-bar-shell": { type: "app-shell", fit: "screen" },
  "action-rail-shell": { type: "app-shell", fit: "screen" },
  "app-shell-mobile-tabs": { type: "app-shell", fit: "screen" },
  "stats-cards": { type: "stats", fit: "content" },
  "stats-meters": { type: "stats", fit: "content" },
  "stats-filtered": { type: "stats", fit: "content" },
  "fleet-table": { type: "data-table", fit: "content" },
  "sparkline-robot-list": { type: "data-visualisation", fit: "content" },
  "sparkline-table": { type: "data-visualisation", fit: "content" },
  "status-tracker-uptime": { type: "data-visualisation", fit: "content" },
  "status-tracker-runs": { type: "data-visualisation", fit: "content" },
  "status-tracker-rollout": { type: "data-visualisation", fit: "content" },
  "radial-chart-battery": { type: "data-visualisation", fit: "content" },
  "radial-chart-goal": { type: "data-visualisation", fit: "content" },
  "radial-chart-capacity": { type: "data-visualisation", fit: "content" },
  "heatmap-week-hours": { type: "data-visualisation", fit: "content" },
  "heatmap-zones": { type: "data-visualisation", fit: "content" },
  "robot-status-card": { type: "card", fit: "content" },
  "card-site": { type: "card", fit: "content" },
  "card-mission": { type: "card", fit: "content" },
  "sign-in": { type: "auth", fit: "screen" },
  "auth-passkey": { type: "auth", fit: "screen" },
  "auth-invite": { type: "auth", fit: "screen" },
  "auth-2fa": { type: "auth", fit: "screen" },
  "settings-page": { type: "settings", fit: "screen" },
  "settings-notifications": { type: "settings", fit: "content" },
  "settings-api-keys": { type: "settings", fit: "content" },
  "settings-billing": { type: "settings", fit: "content" },
  "notification-center": { type: "notifications", fit: "screen" },
  "settings-webhooks": { type: "settings", fit: "content" },
  "settings-sessions": { type: "settings", fit: "content" },
  "record-form": { type: "form", fit: "screen" },
  "status-pages": { type: "states", fit: "content" },
  "marketing-hero": { type: "landing", fit: "content" },
  "dialog-confirm-destructive": { type: "confirm-destructive", fit: "screen" },
  "dialog-form": { type: "dialog", fit: "screen" },
  "dialog-share": { type: "dialog", fit: "screen" },
  "sheet-robot-detail": { type: "sheet", fit: "screen" },
  "sheet-filters": { type: "filters-on-a-phone", fit: "screen" },
  "timeline-activity": { type: "timeline", fit: "content" },
  "timeline-audit": { type: "timeline", fit: "content" },
  "wizard-commission": { type: "wizard", fit: "screen" },
  "wizard-import": { type: "wizard", fit: "screen" },
  "console-overview": { type: "fleet-operations", fit: "screen" },
  "map-workspace": { type: "fleet-operations", fit: "screen" },
  "list-detail": { type: "fleet-operations", fit: "screen" },
  "event-log": { type: "fleet-operations", fit: "screen" },
  "mission-schedule": { type: "fleet-operations", fit: "screen" },
  "data-catalog": { type: "data-operations", fit: "screen" },
  "dataset-detail": { type: "data-operations", fit: "screen" },
  "governance-todo": { type: "data-operations", fit: "screen" },
  "review-queue": { type: "data-operations", fit: "screen" },
  "users-roles": { type: "users-access", fit: "screen" },
  "users-invitations": { type: "users-access", fit: "screen" },
  "users-audit-log": { type: "users-access", fit: "screen" },
  "incident-queue": { type: "incidents", fit: "screen" },
  "incident-detail": { type: "incidents", fit: "screen" },
  "maintenance-due": { type: "maintenance", fit: "screen" },
  "maintenance-work-order": { type: "maintenance", fit: "screen" },
  "rollout-overview": { type: "firmware-rollout", fit: "screen" },
  "rollout-plan": { type: "firmware-rollout", fit: "screen" },
  "agent-runs": { type: "ai-agents", fit: "screen" },
  "agent-trace": { type: "ai-agents", fit: "screen" },
  "agent-approval": { type: "ai-agents", fit: "screen" },
  "agent-chat": { type: "ai-agents", fit: "screen" },
  "line-chart-telemetry": { type: "line-chart", fit: "content" },
  "line-chart-limit": { type: "line-chart", fit: "content" },
  "line-chart-compare": { type: "line-chart", fit: "content" },
  "area-chart-battery": { type: "area-chart", fit: "content" },
  "area-chart-fleet-states": { type: "area-chart", fit: "content" },
  "area-chart-cumulative": { type: "area-chart", fit: "content" },
  "bar-chart-missions": { type: "bar-chart", fit: "content" },
  "bar-chart-ranked": { type: "bar-chart", fit: "content" },
  "bar-chart-stacked": { type: "bar-chart", fit: "content" },
  "bar-chart-variance": { type: "bar-chart", fit: "content" },
  "histogram-battery": { type: "histogram", fit: "content" },
}

/** Where a type is documented: its own page under Blocks, or the Patterns of the component it varies. */
export const typeHref = (t: BlockType) => (t.home ? `/docs/components/${t.home}#${t.slug}` : `/blocks/${t.slug}`)

/** A block's page: its type's page (a block page, or a component page for patterns), scrolled to it. */
export const blockHref = (name: string) => {
  const p = placement[name]
  if (!p) return `/blocks/${name}`
  const t = getBlockType(p.type)
  return t?.home ? `/docs/components/${t.home}#${name}` : `/blocks/${p.type}#${name}`
}

/** The pattern sets a component page shows, in order. */
export const patternsOf = (component: string) => blockTypes.filter((t) => t.home === component)
