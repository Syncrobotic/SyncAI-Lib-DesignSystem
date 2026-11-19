import { readFileSync } from "node:fs"
import { join } from "node:path"
import registry from "../registry.json"

// Where each registry item's live examples come from. Stories are the single source of the states.
export type StoryFile =
  | "stop-button"
  | "slide-to-release"
  | "dock"
  | "island"
  | "list"
  | "actions"
  | "inputs"
  | "display"
  | "feedback"
  | "navigation"
  | "overlays"
  | "charts"
  | "trace"
  | "marker"
  | "stepper"
  | "timeline"
  | "scrollspy"
  | "navigation-menu"
  | "questionnaire"
  | "data-grid"
  | "sortable"
  | "resizable"
  | "file-upload"
  | "attachment"
  | "file-type"
  | "autocomplete"
  | "input-otp"
  | "phone-input"
  | "calendar"
  | "date-selector"
  | "time-picker"
  | "item"
  | "icon-tile"
  | "kbd"
  | "button-group"
  | "scroll-area"
  | "toggle-group"
  | "page-header"
  | "chip-group"
  | "filter-form"
  | "search-field"
  | "theme-toggle"
  | "route-progress"
  | "data-pieces"
/** Stories whose export name starts with `prefix` (or exactly `only`). Overlay stories ending in "Open" are for visual tests and skipped. */
type Examples = { file: StoryFile; prefix?: string; only?: string[] }

export const groups = ["Actions", "Inputs", "Display", "Charts", "Feedback", "Navigation", "Overlays", "Robot shell", "Hooks"] as const
export type Group = (typeof groups)[number]

type Entry = {
  group: Group
  examples?: Examples
  /** Examples use the card's full width (charts). */
  wide?: boolean
  /** Usage rules shown after the examples. */
  rules?: string[]
  /** Keys and what they do, shown as a table. Only what this component adds beyond Tab and focus. */
  keyboard?: [keys: string, action: string][]
}

// Shared by every Radix overlay that traps focus.
const overlayKeys: [string, string][] = [
  ["Esc", "Close and return focus to the control that opened it"],
  ["Tab / Shift+Tab", "Move between controls inside; focus stays inside until it closes"],
]

const entries: Record<string, Entry> = {
  trace: {
    wide: true,
    group: "Display",
    examples: { file: "trace", prefix: "Trace" },
    rules: [
      "Done steps are a neutral check; only warnings and failures are coloured.",
      "A failed step says why in its description; the raw error goes in a TraceCode inside it.",
      "Open the step that needs attention by default, nothing else.",
      "total plus start and duration draw the waterfall; leave them out for a plain list.",
    ],
  },
  marker: {
    group: "Display",
    examples: { file: "marker", prefix: "Marker" },
    rules: [
      "Marker for moments that change how the lines after it read (a takeover, a new day, unread). Not for every event.",
      "MarkerRow is one line; details belong in a Trace or a detail panel.",
      "Tone only for warning and danger.",
    ],
  },
  stepper: {
    group: "Navigation",
    examples: { file: "stepper", prefix: "Stepper" },
    rules: [
      "Only for a fixed sequence people go through once (commissioning, an import). Sections of a page are Tabs.",
      "The current step is the neutral primary, never blue: blue means a machine is working.",
      "An error step says why in its description.",
      "Phones: StepperCompact, not a squeezed row of circles.",
    ],
  },
  timeline: {
    group: "Display",
    examples: { file: "timeline", prefix: "Timeline" },
    rules: [
      "Plain events get a neutral dot. Only warning and danger events are coloured.",
      "Give dateTime so the time is machine-readable.",
      "Newest first for incidents and logs; oldest first for a process.",
    ],
  },
  scrollspy: {
    group: "Navigation",
    examples: { file: "scrollspy", prefix: "Scrollspy" },
    rules: [
      "Each section needs an id and a heading.",
      "Pass root when the page scrolls inside a container.",
      "Hide the rail on phones, or use the pills variant.",
    ],
  },
  "navigation-menu": {
    wide: true,
    group: "Navigation",
    examples: { file: "navigation-menu", prefix: "NavigationMenu" },
    rules: [
      "For a site's top navigation. An app's sections go in the app shell's sidebar; actions go in a DropdownMenu.",
      "Every panel item is a link. Mark the current page with active.",
    ],
  },
  questionnaire: {
    group: "Inputs",
    examples: { file: "questionnaire", prefix: "Questionnaire" },
    rules: [
      "Paged for up to about eight questions on a phone; list when people need to see them all.",
      "Required questions block Next with a message under the question, never a shake.",
      "review lets people check and edit before sending.",
    ],
  },
  "data-grid": {
    wide: true,
    group: "Display",
    examples: { file: "data-grid", prefix: "DataGrid" },
    rules: [
      "Build the table with useReactTable; DataGrid draws it.",
      "Keep data and columns stable (module scope or useMemo). A new array each render loops once a row expands.",
      "Numbers right-aligned (meta.align) and tabular.",
      "Status cells use InlineStatus, never a coloured badge.",
      "virtual needs a maxHeight.",
    ],
  },
  sortable: {
    group: "Inputs",
    examples: { file: "sortable", prefix: "Sortable" },
    rules: [
      "Only the handle drags; the rest of the row stays clickable.",
      "Give getLabel so moves are announced by name.",
      "Keyboard: Space to lift, arrows to move, Space to drop, Escape to cancel.",
    ],
  },
  resizable: {
    wide: true,
    group: "Display",
    examples: { file: "resizable", prefix: "Resizable" },
    rules: ["Set minSize so a panel never collapses into nothing by accident.", "withHandle on touch screens, where a thin line is hard to find."],
  },
  "file-upload": {
    group: "Inputs",
    examples: { file: "file-upload", prefix: "FileUpload" },
    rules: ["Say what is accepted and how big, in the hint.", "Report refused files by name and reason.", "Show what was taken as Attachment rows."],
  },
  attachment: {
    group: "Display",
    examples: { file: "attachment", prefix: "Attachment" },
    rules: ["An error says why in words and offers Retry.", "Remove is always the last action, and names the file for screen readers."],
  },
  "file-type": {
    group: "Display",
    examples: { file: "file-type", prefix: "FileType" },
    rules: ["Neutral like every icon; the label tells formats apart, not colour."],
  },
  autocomplete: {
    group: "Inputs",
    examples: { file: "autocomplete", prefix: "Autocomplete" },
    rules: [
      "For picking one of many known values; for free text use Input.",
      "Disabled options stay in the list so people see why they cannot pick them.",
      "Inside a Field it takes the label, note and error.",
    ],
  },
  "input-otp": {
    group: "Inputs",
    examples: { file: "input-otp", prefix: "InputOTP" },
    rules: [
      "One real input underneath: paste and SMS autofill work.",
      "Say where the code was sent and when it expires.",
      "Show the error under the boxes, not in a toast.",
    ],
  },
  "phone-input": {
    group: "Inputs",
    examples: { file: "phone-input", prefix: "PhoneInput" },
    rules: [
      "Store and send the E.164 value (+886912345678), never the formatted text.",
      "Validate on blur or submit with isPhoneValid, through Field's error.",
    ],
  },
  calendar: {
    group: "Inputs",
    examples: { file: "calendar", prefix: "Calendar" },
    rules: ["The picked day is inverted; today is bold with a ring.", "Weeks start on Monday by default.", "Disabled days stay visible and struck through."],
  },
  "date-selector": {
    group: "Inputs",
    examples: { file: "date-selector", prefix: "Date" },
    rules: [
      "The trigger reads like an input and shows the date in words.",
      "Presets for the ranges people pick most (Last 7 days).",
      "Inside a Field it takes the label, note and error.",
    ],
  },
  "time-picker": {
    group: "Inputs",
    examples: { file: "time-picker", prefix: "Time" },
    rules: ['Values are "HH:mm" on a 24-hour clock; hour12 only changes how they read.', "Taken slots stay in the list, struck through."],
  },
  item: {
    group: "Display",
    examples: { file: "item", prefix: "Item" },
    rules: [
      "One row per thing: a person, a file, a service, a setting link.",
      "Only a link draws the hover fill; a static row never looks clickable.",
      "Robot rows with a live status use the shell's List.",
    ],
  },
  "icon-tile": {
    group: "Display",
    examples: { file: "icon-tile", prefix: "IconTile" },
    rules: [
      "Neutral by default. A tone only when the tile states a status.",
      "Never solid red: a solid danger tile stays on its tint, since solid red belongs to the emergency stop.",
      "Icons inside are 16, 20 or 24 px; the size prop sets them.",
    ],
  },
  kbd: {
    group: "Display",
    examples: { file: "kbd", prefix: "Kbd" },
    rules: ["One key per Kbd; a chord is a KbdGroup without plus signs.", "Use the platform's symbols: ⌘ on Mac, Ctrl elsewhere."],
  },
  "button-group": {
    group: "Actions",
    examples: { file: "button-group", prefix: "ButtonGroup" },
    rules: [
      "Holds no selection; for one choice among several use Segmented control or Toggle group.",
      "Keep destructive actions outside the group.",
      "Give the group an aria-label.",
    ],
  },
  "scroll-area": {
    group: "Display",
    examples: { file: "scroll-area", prefix: "ScrollArea" },
    rules: ["Give it a fixed height (or width) and an aria-label.", "The viewport takes focus so the keyboard can scroll it."],
  },
  "page-header": {
    group: "Navigation",
    examples: { file: "page-header", prefix: "PageHeader" },
    rules: [
      "One per page, first in the content: the breadcrumb says where, the h1 says what. No label above the title.",
      "Meta pills are facts (counts, owner, last update); a status pill takes a tone and only warning and danger are coloured.",
      "Actions sit at the right; the page's one primary action may be among them.",
    ],
  },
  "chip-group": {
    group: "Inputs",
    examples: { file: "chip-group", prefix: "ChipGroup" },
    rules: [
      "One choice among several, with the count each gives. For several choices at once use checkboxes in a FieldSet.",
      "Selected is inverted, like a selected segment.",
      "Fold long rows with max; the selected chip always stays visible.",
      "Chips with href are links: the filter lives in the URL and works without JavaScript.",
    ],
  },
  "filter-form": {
    group: "Inputs",
    examples: { file: "filter-form", prefix: "FilterForm" },
    rules: [
      "Filters that change what a page lists belong in the URL: shareable, bookmarkable, undone with Back.",
      "Typing applies a moment after it stops; a pick applies at once. The page number resets.",
      "It is a plain GET form, so it works before JavaScript loads. Pass onNavigate to stay client-side (Next.js: router.push / router.replace with scroll: false).",
    ],
  },
  "search-field": {
    group: "Inputs",
    examples: { file: "search-field", prefix: "SearchField" },
    rules: [
      "One search box per tool, in the top bar. / focuses it; Enter opens the results page.",
      "On the results page set live: it mirrors ?q= and applies as you type.",
      "For jumping to pages and actions use the command palette (AppShell search); this is for searching data.",
    ],
  },
  "theme-toggle": {
    group: "Actions",
    examples: { file: "theme-toggle", prefix: "ThemeToggle" },
    rules: [
      "Three choices: light, match the system, dark. Match the system is the default.",
      "Pass undefined until the stored choice is known, so nothing is shown selected and then jumps.",
      "In a top bar, at the far right beside the user.",
    ],
  },
  "route-progress": {
    group: "Feedback",
    examples: { file: "route-progress", prefix: "RouteProgress" },
    rules: [
      "For a page that takes long to arrive; it shows after 300 ms, so a quick page never flashes it.",
      "Blue: a process someone is waiting on. It never reaches the end until the page is in.",
      "Drive active from your router; it gives up after 10 s if the navigation never reports back.",
    ],
  },
  "toggle-group": {
    group: "Actions",
    examples: { file: "toggle-group", prefix: "ToggleGroup" },
    rules: [
      'type="single" for one choice, type="multiple" for layers or channels.',
      "On is inverted, like a selected segment.",
      "Icon-only items need an aria-label.",
    ],
  },
  // Actions
  button: {
    group: "Actions",
    examples: { file: "actions", prefix: "Button" },
    rules: [
      "One primary button per view. Primary is neutral high contrast, never blue or red.",
      "Destructive is a danger outline and text. Solid red belongs to the emergency stop alone.",
      "44 px is the default. 36 px only inside cards; 48 px for a page's main action.",
      "Name the result (“Delete route”), not the mechanism (“OK”, “Submit”).",
      "Disabled says why, next to it or in the hint (“Robot offline: cannot dispatch”). Its words stay readable: a grey block, never faded.",
    ],
  },
  "segmented-control": {
    group: "Actions",
    examples: { file: "actions", prefix: "SegmentedControl" },
    rules: ["For two to four views of the same data. For sections of a page, use Tabs.", "The selected segment is inverted, per the selected-state rule."],
  },
  "copy-button": {
    group: "Actions",
    examples: { file: "actions", prefix: "CopyButton" },
    rules: [
      "The icon becomes a check for 1.5 s and the label says Copied: the swap pattern, never a toast.",
      "Icon-only needs a label that names what is copied (Copy reference).",
    ],
  },
  toggle: {
    group: "Actions",
    examples: { file: "actions", prefix: "Toggle" },
    rules: [
      "On/off for one thing, such as an image or map layer. On is inverted.",
      "For one choice among several, use Segmented control; for a setting that applies at once, use Switch.",
    ],
  },
  // Inputs
  input: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Input" },
    rules: [
      "Wrap it in Field for the label, hint and error.",
      "Text is 16 px so iOS does not zoom on focus.",
      "Disabled is a grey field with readable text, not a faded one, and the hint says why it cannot be changed.",
      "An error is a state change: the edge turns danger and 2 px at --motion-fast, the message appears with an icon in the hint's place. Never shake; on submit, move focus to the first field in error.",
    ],
  },
  "input-group": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "InputGroup" },
    rules: [
      "For an icon, a unit or a button inside the field's edge. Use it instead of positioning icons by hand.",
      "Units are text after the value, so “120 m” reads as one; icons are decorative and hidden from screen readers.",
      "Buttons inside (clear, show password) need an aria-label and stay 36 px.",
    ],
  },
  "number-field": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "NumberField" },
    rules: [
      'For a number with a range and a unit: speed, thresholds, intervals. For a free number with no range, Input with inputMode="numeric" is enough.',
      "Never block typing. The value is kept in range when the field loses focus, and the hint says the range.",
      "↑↓ step, Shift or PageUp/PageDown step by largeStep, Home/End go to the limits. The buttons are for touch and skip the Tab order.",
    ],
  },
  textarea: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Textarea" },
    rules: [
      "For text that runs past one line: notes, a reason, a message. One line of text is an Input.",
      "Always with a visible Label; say the limit before it is reached, not after.",
    ],
  },
  label: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Label" },
    rules: [
      "Every field has one, visible, above it. A placeholder is not a label.",
      "Click the label to focus the field: pair them with htmlFor or wrap the control.",
    ],
  },
  field: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Field" },
    rules: [
      "The error replaces the hint in the same line, so the layout does not jump.",
      "Say how to fix it (“At least 8 characters”), not just that it is wrong.",
    ],
  },
  checkbox: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Checkbox" },
    rules: ["Keep the whole 44 px row tappable by pairing it with its Label.", "Changes apply on save. For settings that apply immediately, use Switch."],
  },
  "radio-group": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "RadioGroup" },
    rules: ["For two to five options that all fit on screen. Longer lists use Select."],
  },
  switch: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Switch" },
    rules: ["Takes effect immediately; no save button.", "On is the primary colour, like every selected control; green stays for status."],
  },
  "choice-field": {
    group: "Inputs",
    examples: { file: "inputs", prefix: "ChoiceField" },
    rules: [
      "The whole row is the target, at least 44 px: a tap on the label toggles the control.",
      "Checkboxes and radios at the start; a switch, which acts at once, at the end.",
      "Group choices under one question with FieldSet and a legend; its hint or error sits under the group.",
    ],
  },
  select: {
    group: "Inputs",
    examples: { file: "inputs", prefix: "Select" },
    rules: [
      "Choose one of a known list of five or more. Two to four short options read faster as a SegmentedControl or radios.",
      "Always with a label; a placeholder says what to pick, never which value is the default.",
      "For a long list people search, use Autocomplete.",
    ],
  },
  slider: { group: "Inputs", examples: { file: "inputs", prefix: "Slider" }, rules: ["Always show the current value in the label next to it."] },
  // Display
  badge: {
    group: "Display",
    examples: { file: "display", prefix: "Badge" },
    rules: ["Counts and short states. In list rows prefer Status eyebrow's InlineStatus."],
  },
  card: { group: "Display", examples: { file: "display", prefix: "Card" }, rules: ["Never nest cards. Group rows inside one card with separators."] },
  avatar: {
    group: "Display",
    examples: { file: "display", prefix: "Avatar" },
    rules: [
      "A person or a robot, by picture or initials. Initials when there is no picture, never an empty circle.",
      "Pair it with the name: an avatar alone is not an identity.",
    ],
  },
  separator: {
    group: "Display",
    examples: { file: "display", prefix: "Separator" },
    rules: [
      "Splits groups the eye would otherwise run together. If spacing already separates them, leave it out.",
      "Decorative by default; mark it as a separator only between groups of a menu or toolbar.",
    ],
  },
  progress: {
    group: "Display",
    examples: { file: "display", prefix: "Progress" },
    rules: ["Blue: a process someone is waiting on, with an end. Use another tone only when the value itself is a status, like battery."],
  },
  spinner: {
    group: "Display",
    examples: { file: "display", prefix: "Spinner" },
    rules: [
      "Waits 300 ms before it appears. Work that finishes sooner never flashes a spinner.",
      "Prefer Skeleton when you know the shape of what is loading.",
    ],
  },
  meter: {
    group: "Display",
    examples: { file: "display", prefix: "Meter" },
    rules: [
      "A battery takes only `low`: a low battery needs attention, it is not a failure, so it turns warning and never danger. Danger is for a level that breaks something, like full storage.",
      "For a level in a known range (battery, storage). For work under way, use Progress.",
      "Neutral while normal; warning past `low`, danger past `critical`. Colour only when something is wrong, and the value is always written.",
      "`inline` in table cells; the label is still read by screen readers.",
    ],
  },
  "description-list": {
    group: "Display",
    examples: { file: "display", prefix: "DescriptionList" },
    rules: ["Label above value, value in medium weight with tabular numbers.", "`tiles` only for the few numbers that matter most; everything else plain."],
  },
  "empty-state": {
    group: "Display",
    examples: { file: "display", prefix: "EmptyState" },
    rules: [
      "Says what is missing, why, and the next step as a button. Never a bare “No data”.",
      "When a filter or search caused it, the action clears it.",
    ],
  },
  table: { group: "Display", examples: { file: "display", prefix: "Table" }, rules: ["Right-align numbers. Numbers are tabular by default."] },
  list: {
    group: "Display",
    examples: { file: "list", only: ["GroupedList"] },
    rules: [
      "Rows of the same kind, each a whole touch target at 56 px, with its state in the trailing slot.",
      "Group long lists under headings; more than about 50 rows wants search or a DataGrid.",
    ],
  },
  "status-glyph": {
    group: "Display",
    examples: { file: "display", prefix: "StatusGlyph" },
    rules: [
      "Status is shape plus colour, so it reads without colour vision: filled circle active, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
      "Pass `status`: active, normal, warning, danger or offline. The old `tone` (info, success, warning, danger, neutral) still works until 1.0 and warns once in development.",
    ],
  },
  "status-eyebrow": {
    group: "Display",
    examples: { file: "list", only: ["StatusShapes", "StatusEyebrowOverTitle", "StatusInlineInRows"] },
    rules: [
      "A robot's state above its name, or in a row's trailing slot: shape plus word, always both.",
      "Pass `status`: active, normal, warning, danger or offline. Only warning and danger are coloured.",
    ],
  },
  skeleton: {
    group: "Display",
    examples: { file: "list", only: ["LoadingSkeleton", "SkeletonCard", "SkeletonTableRows"] },
    rules: [
      "Show what is already known; only unknown values get a skeleton.",
      "The whole group breathes over 1.2 s with no diagonal shimmer, and stops under reduced motion.",
    ],
  },
  // Feedback, most urgent first. The Alarms foundation explains which one to use.
  alarm: {
    group: "Feedback",
    examples: { file: "feedback", prefix: "Alarm" },
    rules: [
      "Only for an abnormal condition that needs an operator to act. No action, no alarm: log it instead.",
      "Three priorities, each with its own shape, colour and word: critical (act now), high (act within minutes), low (act when convenient).",
      "Stays until the condition clears and someone acknowledges it. Acknowledging records that it was seen; it does not clear it.",
      "Never auto-dismissed, never a toast, never blinking: the bar and the word “Unacknowledged” carry the state; only critical alarms are also tinted.",
      "One alarm per root cause. If the robot is offline, do not also raise camera lost and lidar lost.",
      "Shelving hides a nuisance alarm for a set time and it comes back on its own; it is never permanent and never for critical alarms. Suppressed by design (the app's logic) and out of service (maintenance) are counted under the list, not hidden silently.",
      "Pass `raisedAt` so a flood (over 10 alarms in 10 minutes) is named and the low ones fold away; then fix the root cause the flood points to.",
    ],
  },
  "share-bar": {
    group: "Display",
    examples: { file: "data-pieces", prefix: "ShareBar" },
    rules: [
      "How a whole splits into a few parts (up to five, then “Other”). For values over time or many categories, use a chart.",
      "Colours follow the order you give, never the size, and are never status colours.",
      "Outside a table cell, show the legend: identity never rests on colour alone. In a table, the column header names the parts.",
    ],
  },
  "restricted-preview": {
    group: "Display",
    examples: { file: "data-pieces", prefix: "RestrictedPreview" },
    rules: [
      "For pictures someone should choose to see: restricted tiers, faces, number plates. Nothing loads until they ask.",
      "Neutral, not a warning colour: restricted is a property of the data, not a fault. Say why in `reason`.",
      "Each preview reveals on its own; log the reveal in `onReveal` if the data needs an audit trail.",
    ],
  },
  alert: {
    group: "Feedback",
    examples: { file: "display", prefix: "Alert" },
    rules: [
      "A condition on this page that stays while it is true (a licence about to expire, a form that cannot be sent). No acknowledge.",
      "If the operator must act on the robot, it is an alarm instead.",
    ],
  },
  toast: {
    group: "Feedback",
    examples: { file: "feedback", prefix: "Toast" },
    rules: [
      "The result of what the user just did, or a minor event. Web and dashboard use Toast; the control app uses the island's notices, with the same timings.",
      "4 s; 8 s when it offers an action such as Undo; failures stay until dismissed. Hovering or focusing pauses the timer.",
      "At most three on screen. Never use a toast for an alarm.",
    ],
  },
  // Navigation
  breadcrumb: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Breadcrumb" },
    rules: ["Each level is a link; the current page is last and is not.", "In an app shell, pass it as `breadcrumb`: the top bar's title is the current page."],
  },
  pagination: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Pagination" },
    rules: [
      "Say the range (1–10 of 48) so people know how much there is.",
      "Previous and next disable at the ends. Numbered pages only for long lists people jump around in.",
      "When the list is a page of its own, use `href` so each page is a URL: shareable, Back works, no JavaScript needed.",
      "On a phone or in a gallery, prefer LoadMore: pages suit a desktop table, a growing list suits scrolling.",
    ],
  },
  "load-more": {
    group: "Navigation",
    examples: { file: "data-pieces", prefix: "LoadMore" },
    rules: [
      "Say how much is shown, and on the button how many it adds and how many remain. Never “Load more” alone.",
      "It disappears once everything is shown. For a desktop table people jump around in, use Pagination.",
    ],
  },
  tabs: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Tabs" },
    rules: [
      "Switch between views of the same thing, all at the same level. Not for steps (Stepper) or for moving between pages.",
      "Keep the labels short and the order stable.",
    ],
  },
  accordion: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Accordion" },
    rules: [
      "Long content most people skip: FAQs, advanced settings. Content everyone needs stays open.",
      "One open at a time only when the sections are alternatives.",
    ],
  },
  // Overlays: the docs show the closed trigger; the *Open stories are for visual tests.
  dialog: { group: "Overlays", examples: { file: "overlays", prefix: "Dialog" }, rules: ["A short decision. On phones prefer Sheet for anything longer."] },
  "alert-dialog": {
    group: "Overlays",
    examples: { file: "overlays", prefix: "AlertDialog" },
    rules: ["Only for actions that cannot be undone.", "The confirm names the consequence (“Delete 38 GB”); the cancel names what is kept."],
  },
  sheet: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Sheet" },
    rules: [
      "Detail or a short form beside the list it came from, keeping the list in view. A decision that blocks the task is a Dialog.",
      "Bottom on phones, right on wide screens, left for navigation. Esc and the scrim close it.",
    ],
  },
  popover: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Popover" },
    rules: [
      "A small control or a few facts tied to one trigger: a filter, a colour, a definition.",
      "More than a few fields, or a decision, is a Sheet or Dialog. A hint that needs no interaction is a Tooltip.",
    ],
  },
  tooltip: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Tooltip" },
    rules: ["Touch screens never show tooltips. Never put information the operator needs in one."],
  },
  chart: {
    group: "Charts",
    wide: true,
    examples: { file: "charts", prefix: "Chart" },
    rules: [
      "Colour is the series' identity, not its rank: slots --chart-1…5 in a fixed order, kept with the series when others are filtered out. Never a status colour as a series.",
      "Two series or more: a legend above the plot. One series: no legend; the title names it.",
      "Every chart offers its numbers as a table (ChartTable), for exact values and for anyone who cannot tell two hues apart.",
      "One y axis. Two measures on different scales are two charts.",
      "Lines 2 px; bars with 4 px rounded data ends and a 2 px gap; a horizontal hairline grid; no axis lines.",
      "The chart fades in when it mounts (--motion-base); marks do not animate, because Recharts cannot use the motion tokens. Nothing moves under reduced motion.",
    ],
  },
  command: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Command" },
    rules: [
      "One palette per tool, opened by ⌘K / Ctrl+K and by the search field in the top bar (AppShell `search`).",
      "Group results by kind (robots, pages, actions) and show a detail on the right, such as the robot's state.",
      "The empty state says what was searched and what to try, not just “No results”.",
    ],
  },
  "dropdown-menu": { group: "Overlays", examples: { file: "overlays", prefix: "DropdownMenu" }, rules: ["Destructive items go last, after a separator."] },
  // Robot shell
  "stop-button": {
    group: "Robot shell",
    examples: { file: "stop-button" },
    rules: [
      "UI only: it takes `state` and calls onStop, onStopAll or onWake. Sending the command, waiting for the dog and falling back to Bluetooth after 1.5 s belong to the app, which passes the result back as `state`.",
      "Solid red is reserved for the emergency stop. Other destructive actions use the danger outline and text.",
      "Its height is --h-stop: 56 px, 64 px in glove density, and it never shrinks (compact leaves it alone). Only the stop, wake and slide to release use it.",
      "It buzzes at the touch and for the answer it is shown (unconfirmed, delivered over Bluetooth). When the app swaps it for SlideToRelease on confirmation, the app calls feedback(\"stopConfirmed\") at that moment.",
      "Works the same for every input: touch or click stops; Enter or Space stops; holding any of them for 2 s stops all; a screen-reader or switch-control activation stops.",
      "Every string can be replaced through `labels` (WakeButton: `label` and `reason`) to localise.",
    ],
  },
  "slide-to-release": {
    group: "Robot shell",
    examples: { file: "slide-to-release" },
    rules: [
      "Letting go past 85% releases; short of that the thumb springs back in 200 ms.",
      "Viewers can see it but cannot release.",
      "Keyboard and switch control: hold Enter or Space for 2 s.",
      "If the robot does not release, set `failed`: the thumb goes back and the label says to slide again. Never leave it on Releasing….",
    ],
  },
  dock: {
    group: "Robot shell",
    examples: { file: "dock" },
    rules: [
      "Three tiers, top to bottom: state action, this page's primary action, navigation.",
      "Actions in the lower tiers are never solid white, so they do not compete with the stop.",
    ],
  },
  island: {
    group: "Robot shell",
    examples: { file: "island" },
    rules: [
      "Name, device status and notifications each expand on their own.",
      "Failure notices stay until handled. Persistent states (offline, stopped) change the tray edge colour.",
      "IslandAlarm shows the most urgent unacknowledged alarm above any notice, from the same data as AlarmList. The edge follows it: critical danger, high warning.",
      "On a phone the island is the alarm surface, so it buzzes, sounds (critical repeats until acknowledged) and announces new alarms, like AlarmList. Turn `feedback` off on one of them when both are on screen.",
    ],
  },
  tray: {
    group: "Robot shell",
    rules: ["The shared frame of the island and the dock: radius 24 = inner radius 16 + padding 8. See Dock and Dynamic island for examples."],
  },
  // Hooks
  "use-long-press": { group: "Hooks", rules: ["Returns hold progress from 0 to 1. The emergency stop uses it for hold-to-stop-all."] },
  "use-slide-release": { group: "Hooks", rules: ["Drag, threshold and spring-back logic behind Slide to release."] },
}

export type Item = (typeof registry.items)[number] & Entry

// What each component does with the keyboard beyond Tab. Radix supplies most of it; these tables say so out loud.
const keyboard: Record<string, [string, string][]> = {
  trace: [
    ["Tab", "Focus a step that opens"],
    ["Enter / Space", "Open or close its details"],
  ],
  stepper: [
    ["Tab", "Focus a step people may go back to"],
    ["Enter / Space", "Go to that step"],
  ],
  scrollspy: [
    ["Tab", "Focus a section link"],
    ["Enter", "Scroll to the section and move focus to it"],
  ],
  "navigation-menu": [
    ["Enter / Space", "Open a panel"],
    ["Arrow keys", "Move between top-level items"],
    ["Tab", "Move into an open panel"],
    ["Escape", "Close the panel"],
  ],
  questionnaire: [
    ["Arrow keys", "Choose an option or a point on a scale"],
    ["Space", "Tick a checkbox"],
    ["Enter", "Next, or send on the last page"],
  ],
  "data-grid": [
    ["Tab", "Focus the grid region, then the headers and cells' controls"],
    ["Arrow keys", "Scroll the region"],
    ["Enter / Space", "Open a column menu, toggle a checkbox"],
  ],
  sortable: [
    ["Space", "Lift or drop the focused item"],
    ["Arrow keys", "Move the lifted item"],
    ["Escape", "Cancel the move"],
  ],
  resizable: [
    ["Tab", "Focus a handle"],
    ["Arrow keys", "Resize"],
    ["Home / End", "Collapse or expand fully"],
    ["Enter", "Toggle a collapsible panel"],
  ],
  "file-upload": [
    ["Tab", "Focus the drop zone"],
    ["Enter / Space", "Open the file picker"],
  ],
  autocomplete: [
    ["Arrow Down / Up", "Open the list, move between options"],
    ["Enter", "Pick the highlighted option"],
    ["Escape", "Close and restore the picked value"],
  ],
  "input-otp": [
    ["Type", "Fill the next box"],
    ["Backspace", "Clear the previous box"],
    ["Arrow Left / Right", "Move between boxes"],
  ],
  calendar: [
    ["Arrow keys", "Move by day or week"],
    ["Page Up / Page Down", "Previous or next month"],
    ["Home / End", "Start or end of the week"],
    ["Enter / Space", "Pick the focused day"],
  ],
  "time-picker": [
    ["Enter", "Commit the typed time (TimeInput)"],
    ["Tab", "Leave the field; the time is read on blur"],
  ],
  "scroll-area": [
    ["Tab", "Focus the scroll region"],
    ["Arrow keys", "Scroll"],
    ["Page Up / Page Down", "Scroll by a page"],
  ],
  "toggle-group": [
    ["Tab", "Move into the group"],
    ["Arrow keys", "Move between items"],
    ["Enter / Space", "Turn the focused item on or off"],
  ],
  button: [["Enter / Space", "Activate"]],
  "segmented-control": [
    ["← / →", "Move to the previous or next segment"],
    ["Enter / Space", "Select the focused segment"],
  ],
  toggle: [["Enter / Space", "Turn on or off"]],
  "number-field": [
    ["↑ / ↓", "Step up or down"],
    ["Shift+↑ / Shift+↓", "Step by the large step"],
    ["PageUp / PageDown", "Step by the large step"],
    ["Home / End", "Go to the minimum or maximum"],
    ["Enter", "Keep the typed value (kept in range)"],
  ],
  checkbox: [["Space", "Check or uncheck"]],
  "radio-group": [["↑ ↓ / ← →", "Move to and select the previous or next option"]],
  switch: [["Enter / Space", "Turn on or off"]],
  select: [
    ["Enter / Space / ↓", "Open the list"],
    ["↑ / ↓", "Move between options"],
    ["Type a letter", "Jump to the first option starting with it"],
    ["Enter", "Choose"],
    ["Esc", "Close without changing"],
  ],
  slider: [
    ["← → / ↑ ↓", "Step down or up"],
    ["PageUp / PageDown", "Step by 10%"],
    ["Home / End", "Go to the minimum or maximum"],
  ],
  tabs: [
    ["← / →", "Move to and open the previous or next tab"],
    ["Home / End", "First or last tab"],
  ],
  accordion: [
    ["Enter / Space", "Open or close the section"],
    ["↑ / ↓", "Move between section headers"],
    ["Home / End", "First or last header"],
  ],
  dialog: overlayKeys,
  "alert-dialog": [
    ["Esc", "Cancel"],
    ["Tab / Shift+Tab", "Move between the actions; Cancel has focus first"],
  ],
  sheet: overlayKeys,
  popover: [["Esc", "Close and return focus"]],
  tooltip: [
    ["Focus", "Show"],
    ["Esc", "Hide"],
  ],
  command: [
    ["⌘K / Ctrl+K", "Open or close the palette"],
    ["↑ / ↓", "Move between results"],
    ["Enter", "Run the highlighted result"],
    ["Esc", "Close and return focus"],
  ],
  pagination: [
    ["Tab", "Move between previous, the pages and next"],
    ["Enter / Space", "Go to that page"],
  ],
  breadcrumb: [
    ["Tab", "Move between the levels"],
    ["Enter", "Open that level"],
  ],
  "choice-field": [
    ["Space", "Toggle the focused checkbox or switch"],
    ["↑ ↓", "Move between radio options"],
  ],
  "copy-button": [["Enter / Space", "Copy"]],
  "dropdown-menu": [
    ["Enter / Space / ↓", "Open the menu"],
    ["↑ / ↓", "Move between items"],
    ["Enter", "Run the item"],
    ["Esc", "Close and return focus"],
  ],
  toast: [
    ["F8", "Move focus to the notifications"],
    ["Esc", "Dismiss the focused notification"],
  ],
  "stop-button": [
    ["Enter / Space", "Stop this robot"],
    ["Hold Enter / Space 2 s", "Stop all robots"],
  ],
  "slide-to-release": [["Hold Enter / Space 2 s", "Release"]],
}

export const items: Item[] = registry.items
  .filter((i) => i.name in entries)
  .map((i) => ({ ...i, ...entries[i.name], keyboard: keyboard[i.name] }))
  .sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group))

export const getItem = (name: string) => items.find((i) => i.name === name)

const root = process.cwd()

export function readSource(path: string) {
  return readFileSync(join(/*turbopackIgnore: true*/ root, path), "utf8")
}

/** Story export names in the order they are written, so the page follows the author's order. */
export function storyNames(ex: Examples) {
  const src = readSource(`stories/${ex.file}.stories.tsx`)
  const names = [...src.matchAll(/^export const ([^\s:=]+)\s*[:=]/gm)].map((m) => m[1])
  const picked = ex.only ? names.filter((n) => ex.only!.includes(n)) : ex.prefix ? names.filter((n) => n.startsWith(ex.prefix!) && !n.endsWith("Open")) : names
  // Fail the build rather than publish a component page with its examples silently missing.
  if (picked.length === 0) throw new Error(`No stories in stories/${ex.file}.stories.tsx match ${ex.prefix ?? ex.only?.join(", ")}`)
  return picked
}

/** "ThreeTiersWithPageAction" -> "Three tiers with page action", as Storybook shows it. */
export const storyTitle = (name: string) => {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .split(" ")
  // Proper names keep their capital: "Delivered over Bluetooth", not "bluetooth".
  const proper = new Set(["Bluetooth", "Wi", "Fi", "AI", "URL", "SMS"])
  return words.map((w, i) => (i === 0 || proper.has(w) ? w : w.toLowerCase())).join(" ")
}
