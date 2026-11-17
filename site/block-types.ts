// Blocks are grouped like components: a group, then a type, then the blocks (variants) of that type.
// A type page shows every block of the type, the way a component page shows every example.
// Application: the screens and sections any app is built from. Charts: data shown as charts. Solutions: whole
// working screens for one job in robot operations, built from the other two.

export const blockGroups = ["Application", "Charts", "Solutions"] as const
export type BlockGroup = (typeof blockGroups)[number]

export type BlockType = {
  slug: string
  title: string
  group: BlockGroup
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
    use: ["Internal tools and consoles with more than a handful of pages.", "A site or tool that only needs a top bar."],
    instead: ["A single screen with no navigation: start from a Solutions block."],
    rules: [
      "One shell per product. Pages change inside it; the shell does not.",
      "The current page is marked in the navigation and named in the top bar.",
      "On phones the sidebar becomes a drawer; nothing is hidden for good.",
    ],
  },
  {
    slug: "stats",
    title: "Stats",
    group: "Application",
    description: "Headline numbers with their change: the first row of a dashboard.",
    use: ["The top of an overview page.", "A row of KPIs above a table or a chart."],
    instead: ["One number in context of time: a Charts block with a sparkline.", "A whole overview screen: Solutions › Fleet operations."],
    rules: ["Four numbers at most in a row.", "A change is coloured by whether it is good, not by its direction.", "Every number has a unit and a time range."],
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
    description: "Getting in: company SSO first, an email link as the fallback, and what happens next.",
    use: ["The sign-in page of an internal tool or console."],
    rules: ["The way most people sign in is the first button.", "Errors sit under the field they are about and never clear what was typed."],
  },
  {
    slug: "settings",
    title: "Settings",
    group: "Application",
    description: "Sections beside their explanation; switches apply at once, fields collect into a save bar.",
    use: ["Account, site and fleet settings.", "Any page of preferences."],
    instead: ["Creating or editing one record: Form."],
    rules: ["A switch applies at once; text fields wait for Save.", "Say what a setting does next to it, not in a tooltip."],
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
  // Solutions
  {
    slug: "fleet-operations",
    title: "Fleet operations",
    group: "Solutions",
    description: "Watching and running a fleet: the overview, the live map, robot lists, the event log.",
    use: ["The control room console.", "Supervisors watching several sites."],
    rules: [
      "Normal is calm: colour only for what needs someone.",
      "The emergency stop is always one tap away and is the only solid red.",
      "Alarms sort by unacknowledged, then priority, then time.",
    ],
  },
  {
    slug: "data-operations",
    title: "Data operations",
    group: "Solutions",
    description: "Robot datasets as a product: the catalog, one dataset's release readiness, and the review queue.",
    use: ["Teams that collect, label and release robot data."],
    rules: ["Only restricted tiers are coloured.", "A release verdict says what blocks it, not just that it is blocked."],
  },
  {
    slug: "users-access",
    title: "Users and access",
    group: "Solutions",
    description: "Who can do what: roles changed in place, invitations, removals with undo.",
    use: ["The members page of any console."],
    rules: ["Roles are words people know (Operator, Supervisor), not permission lists.", "Removing someone can be undone for a few seconds."],
  },
]

export const getBlockType = (slug: string) => blockTypes.find((t) => t.slug === slug)

// Where each block lives (site/block-types.ts) and how its frame sizes: whole screens keep a screen height, sections
// follow their content. The order here is the order on the type page.
export const placement: Record<string, { type: string; fit: "screen" | "content" }> = {
  "app-shell": { type: "app-shell", fit: "screen" },
  "top-bar-shell": { type: "app-shell", fit: "screen" },
  "stats-cards": { type: "stats", fit: "content" },
  "robot-status-card": { type: "card", fit: "content" },
  "sign-in": { type: "auth", fit: "screen" },
  "settings-page": { type: "settings", fit: "screen" },
  "record-form": { type: "form", fit: "screen" },
  "status-pages": { type: "states", fit: "content" },
  "marketing-hero": { type: "landing", fit: "content" },
  "console-overview": { type: "fleet-operations", fit: "screen" },
  "map-workspace": { type: "fleet-operations", fit: "screen" },
  "list-detail": { type: "fleet-operations", fit: "screen" },
  "event-log": { type: "fleet-operations", fit: "screen" },
  "fleet-table": { type: "fleet-operations", fit: "content" },
  "data-catalog": { type: "data-operations", fit: "screen" },
  "dataset-detail": { type: "data-operations", fit: "screen" },
  "governance-todo": { type: "data-operations", fit: "screen" },
  "users-roles": { type: "users-access", fit: "screen" },
}

/** A block's page: its type page, scrolled to it. */
export const blockHref = (name: string) => (placement[name] ? `/blocks/${placement[name].type}#${name}` : `/blocks/${name}`)
