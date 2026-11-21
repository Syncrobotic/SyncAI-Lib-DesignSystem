import { readFileSync } from "node:fs"
import { join } from "node:path"
import registry from "../registry.json"

// Where each registry item's live examples come from. Stories are the single source of the states.
export type StoryFile =
  | "stop-button"
  | "slide-to-release"
  | "teleop-pad"
  | "dock"
  | "island"
  | "list"
  | "actions"
  | "inputs"
  | "form"
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
  | "code-block"
  | "button-group"
  | "scroll-area"
  | "toggle-group"
  | "page-header"
  | "chip-group"
  | "filter-form"
  | "filters"
  | "search-field"
  | "theme-toggle"
  | "route-progress"
  | "data-pieces"
  | "image-grid"
  | "annotated-image"
  | "media-player"
  | "camera-feed"
  | "joint-state"
  | "tree"
  | "graph"
  | "robot-map"
  | "hooks"
  | "metric-card"
  | "context-menu"
  | "hover-card"
  | "banner"
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
  graph: {
    group: "Display",
    wide: true,
    examples: { file: "graph", prefix: "Graph" },
    rules: [
      "For a node with several inputs: lineage, a training run's inputs and outputs, a mission's parallel steps. When every node has one parent, use a Tree.",
      "Offer GraphList beside it (a Graph / List switch), as a chart offers its table: the same nodes as text, inputs before what they feed. On a phone the list reads without scrolling sideways.",
      "Up to about 60 nodes. A bigger graph needs a dedicated layout library and panning; show a part of it (one node's lineage) instead.",
      "Edges are neutral; the selected node's path is drawn in the ink colour and the rest steps back. No colours per edge or per kind of node.",
      "Status is a shape and a word; only warning and danger are coloured. Steps that did not run are grey and say so (\"Not run\").",
      "Names fit a box: about 28 characters show in full, longer ones end in an ellipsis. Put the detail in meta, one short line.",
    ],
  },
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
    /** Horizontal steps need the row: examples use the card's full width, like charts. */
    wide: true,
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
      "Tones info and success render neutral: a tile stays on screen, so it is a state, and a state is grey. Only warning and danger colour it.",
      "Never solid red: a solid danger tile stays on its tint, since solid red belongs to the emergency stop.",
      "Icons inside are 16, 20 or 24 px; the size prop sets them.",
    ],
  },
  "text-diff": {
    group: "Display",
    /** Side by side needs the row: examples use the card's full width. */
    wide: true,
    examples: { file: "display", prefix: "TextDiff" },
    rules: [
      "Inserted words are a grey block with an underline; removed words are struck through in secondary text. A removal is not an error: no danger, no green, no blue.",
      "Inline for a sentence or two; side by side when people read each version whole. Side by side stacks when its container is narrower than 448 px.",
      "Keep the summary line (+3 words, −1 word): it says how big the change is before anyone reads it.",
      "Words are split on spaces, punctuation included; Chinese and Japanese by character.",
    ],
  },
  kbd: {
    group: "Display",
    examples: { file: "kbd", prefix: "Kbd" },
    rules: [
      "One key per Kbd; a chord is a KbdGroup without plus signs.",
      "Use the platform's symbols: ⌘ on Mac, Ctrl elsewhere.",
      "pressed shows the key going down (it sinks and its edge darkens) while its shortcut runs; useHotkeys returns which key that is.",
    ],
  },
  "code-block": {
    group: "Display",
    examples: { file: "code-block", prefix: "CodeBlock" },
    rules: [
      "Copy copies `code` exactly, whatever the block shows: highlighted children, wrapped lines or a hidden secret.",
      "wrap=\"words\" for shell commands, so a phone never cuts a package name in two; wrap=\"none\" for source, which scrolls sideways with a fade on the side that hides text.",
      "A one-time secret (an API key) is `secret`: dots until Show is pressed. Never put the value in the title or a label; say beside it that it is shown once.",
      "No highlighter inside: pass shiki's output (or any `<pre>`) as children. Line numbers only for source people discuss by line.",
    ],
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
  filters: {
    group: "Inputs",
    examples: { file: "filters", prefix: "Filters" },
    rules: [
      "For a query people build themselves: any field, any number of rules. For a few fixed facets use Chip group or Filter form.",
      "Rules combine with AND, and the bar says so between the chips. There are no groups and no OR.",
      "Keep the rules in the URL with toSearchParams and fromSearchParams, so a filtered view can be shared and undone with Back.",
      "Show what the rules leave (\"12 of 40 robots\") next to the bar, in a polite live region.",
      "Every label is a prop; translate the operators too.",
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
      "Three choices: light, match the system, dark. With no stored choice the app's default applies: light (:root).",
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
      "44 px is the default. 36 px (sm) is for a mouse only: on a touch screen it is 44 px by itself. 48 px for a page's main action.",
      "Name the result (“Delete route”), not the mechanism (“OK”, “Submit”).",
      "Disabled says why, next to it or in the hint (“Robot offline: cannot dispatch”). Its words stay readable: filled buttons become a grey block; outline and destructive keep their outline with text-disabled; never opacity.",
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
      "Buttons inside (clear, show password) need an aria-label; they are 36 px with a mouse and 44 px on touch, like every compact control.",
    ],
  },
  "number-field": {
    group: "Inputs",
    examples: { file: "inputs", only: ["NumberFieldSpeed", "NumberFieldKinds", "NumberFieldStates"] },
    rules: [
      "The value and its unit are one reading, centred between − and +: write the unit with `unit`, not in the label.",
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
  form: {
    group: "Inputs",
    examples: { file: "form", prefix: "Form" },
    rules: [
      "No wrapper: each control goes in React Hook Form's Controller and the kit's Field (FieldSet for a group). Field wires the label, hint, error, aria-invalid and aria-describedby.",
      "Errors wait for the first submit, then follow each change (React Hook Form's default mode). Never tell someone off while they type a first answer.",
      "Give field.ref to something focusable, so a failed submit focuses the first field in error: {...field} on an Input, ref on a Select's trigger, ref on a group's first choice.",
      "A refusal about one field (a name already taken) goes on that field with setError; one about the whole save goes in an Alert above the fields (setError(\"root.server\", …)). Never in a toast.",
      "Await the save in onSubmit and pass formState.isSubmitting to the button's loading. Name the result (“Create mission”), not “Submit”. Write the messages in the schema, in the page's language.",
    ],
    keyboard: [
      ["Enter", "In a text field, submits the form"],
      ["Tab / Shift+Tab", "Moves between fields; after a failed submit, focus starts on the first field in error"],
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
    rules: ["Takes effect immediately; no save button.", "On is the primary colour, like every selected control; never green (green is a confirmation that just happened, not a setting)."],
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
    rules: [
      "Counts and short states. In list rows prefer Status eyebrow's InlineStatus.",
      "Test and audit results: Passed is the neutral badge with CircleCheck; Failed is tone=\"outline\" with text-danger ring-danger and CircleAlert; Not enough samples is tone=\"outline\" with text-muted-foreground and CircleDashed. Never a green pass.",
    ],
  },
  card: { group: "Display", examples: { file: "display", prefix: "Card" }, rules: ["Never nest cards. Group rows inside one card with separators."] },
  avatar: {
    group: "Display",
    examples: { file: "display", prefix: "Avatar" },
    rules: [
      "A person or a robot, by picture or initials. Initials when there is no picture, never an empty circle.",
      "People are round; robots, sites and teams are square (shape=\"square\"), so a mixed list tells who from what before the name is read.",
      "Pair it with the name: an avatar alone is not an identity. A status badge is said in words too, nearby or in the label.",
      "A group shows a few and folds the rest into +N (max); its label names everyone.",
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
    rules: [
      "Blue: a process someone is waiting on, with an end. A level that stays (battery, storage, signal) is a Meter, not a Progress.",
      "Success is neutral: a finished bar stays grey. Green is a confirmation that comes and goes (a toast), not a state.",
    ],
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
      "For a level in a known range (battery, storage). For work under way, use Progress.",
      "Neutral while normal; warning past `low`, danger past `critical`; the value is always written. A battery takes only `low` (15 %): a low battery needs attention, it is not a failure, so it turns warning and never danger. Danger is for a level that breaks something, like full storage.",
      "`inline` in table cells; the label is still read by screen readers.",
    ],
  },
  "metric-card": {
    group: "Display",
    /** A row of cards needs the row: examples use the card's full width. */
    wide: true,
    examples: { file: "metric-card", prefix: "MetricCard" },
    rules: [
      "Only a change for the worse is coloured (`trend=\"bad\"`, danger text). Good news stays foreground and no change stays grey, so the bad number is the one people see. The trend says whether the change is good, not which way it went.",
      "The sparkline is neutral and silent; the delta and the caption say in words what it shows. From 640 px it sits beside the value; on a phone it takes its own full-width line under it, and the change sits under the label so the values line up.",
      "A value that cannot be read is `unavailable` with the reason; never a 0 or an empty card.",
      "`loading` keeps the label and the card's height; only the value, change and caption are bones.",
      "`href` makes the whole card one link (pass `linkAs` for your router); give it only when a page sits behind the number.",
      "Put the cards in a MetricGrid: two across from the smallest phone, four from 1280 px. One row under the page header, what needs someone (alarms) above it.",
      "A level in a known range (battery, storage, signal) is a Meter, not a metric card.",
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
      "Status is a shape and a word; colour only when it is abnormal. The shape reads without colour vision: filled circle active, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
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
      "Never auto-dismissed, never a toast, never blinking, never a tinted row. Colour is only on the glyph and the priority word. Unacknowledged: bold title and a solid bar in the priority's colour. Cleared but not acknowledged: still bold, the bar dashed, and it says when it cleared. Acknowledged: regular and grey, with when (“Acknowledged 13:42”, from `acknowledgedAt`).",
      "Time comes first, in tabular figures, so order and age read down the column. Below 576 px of width the row reflows: the time under the title, the state and buttons on a line of their own.",
      "“Acknowledge all” appears only when the app passes onAcknowledgeAll, with two or more alarms it may take in view, and takes only those: never a critical alarm (each is acknowledged on its own row; the button then reads “Acknowledge 3 non-critical”), never shelved, suppressed or out-of-service alarms, and in a flood the folded low ones only while their group is open (“Acknowledge 2 shown”). Screen readers hear how many were acknowledged. Leave it out where every alarm must be read on its own.",
      "One alarm per root cause. If the robot is offline, do not also raise camera lost and lidar lost.",
      "Shelving hides a nuisance alarm for a set time and it comes back on its own; it is never permanent and never for critical alarms. Suppressed by design (the app's logic) and out of service (maintenance) are counted under the list, not hidden silently.",
      "Pass `raisedAt` so a flood (over 10 alarms in 10 minutes) is named and the low ones fold away; then fix the root cause the flood points to.",
    ],
  },
  "share-bar": {
    group: "Display",
    examples: { file: "data-pieces", prefix: "ShareBar" },
    rules: [
      "How a whole splits into a few parts (up to three, then “Other”): the first in the accent, then two greys, then the light grey for Other. For values over time or many categories, use a chart.",
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
  "image-grid": {
    wide: true,
    group: "Display",
    examples: { file: "image-grid", prefix: "ImageGrid" },
    rules: [
      "Every tile keeps its aspect box before and after the picture loads, so the grid never jumps; pictures load lazily.",
      "Give each picture an alt that says what it shows, and its file name: the name is what a broken tile and the lightbox title show.",
      "Picked tiles are ringed in the focus ink with a check, never a status colour. While picking, the corner button opens the lightbox.",
      "Pictures the viewer must ask to see are `restricted`, with a `reason`; nothing loads before they ask. Log the view in `onReveal`.",
      "Use the strip for a short row, such as what was just uploaded; for a whole dataset, the grid.",
    ],
  },
  "annotated-image": {
    wide: true,
    group: "Display",
    examples: { file: "annotated-image", prefix: "AnnotatedImage" },
    rules: [
      "Coordinates are the picture's own pixels; give its natural `width` and `height`. The box keeps that aspect ratio, so the marks line up at any size.",
      "Line style says where a mark came from (predicted solid, ground truth dashed, previous dotted); the class is the word on it. Never a colour per class, never status colours.",
      "Keep the legend (or an AnnotationLegend nearby) whenever more than one kind is on screen.",
      "Crowded picture, or a picture shown phone-wide: `showLabels=\"selected\"`. The words are still read out in the summary or on each annotation's button.",
      "Selectable only when something happens on select (a details panel, a review); otherwise the picture is one image with a summary.",
    ],
  },
  "media-player": {
    wide: true,
    group: "Display",
    examples: { file: "media-player", prefix: "MediaPlayer" },
    rules: [
      "For a recorded clip with an end. A live camera is `camera-feed`: no timeline, no speed, a latency and a connection state instead.",
      "Give `label` the clip's who, where and when (\"Patrol dog 7F3A, front camera, 14:02\"); it names the player for screen readers.",
      "Pass `duration` from the clip's record, so the time and the markers show before the file loads; `preload=\"none\"` in a long list of clips.",
      "Markers are events in the clip (Obstacle, Stop pressed), a word each, at most a handful. They are listed under the player too, for the keyboard and screen readers.",
      "Never autoplay with sound. `autoPlay` starts muted and does nothing for someone who asked for reduced motion.",
      "When the clip cannot play, say why after \"Clip unavailable:\" (not uploaded yet, expired, the robot was offline) and offer a retry only when retrying can help.",
    ],
  },
  "camera-feed": {
    wide: true,
    group: "Display",
    examples: { file: "camera-feed", prefix: "CameraFeed" },
    rules: [
      "For a live camera. A recording with an end is `media-player`.",
      "The app owns the connection (WebRTC, a gateway, a live URL); pass the `stream` or `src` and say what the connection is doing in `status`. The feed tells Live from Stalled by itself, from the frames.",
      "Give `label` the camera and `source` the robot (\"Front camera\", \"Patrol dog 7F3A\"): the header writes both, and they name the feed for screen readers.",
      "Pass `latencyMs` whenever you measure it: an operator driving from the picture needs to know how old it is.",
      "Never hide a frozen picture: keep `staleAfterMs` at its 2 s default, shorter for teleoperation, longer only for a camera that sends a frame every few seconds.",
      "Overlays (`children`) are drawn in the video box's own coordinates; they hide while there is no picture, so a box never floats over a skeleton.",
      "Offer Reconnect (`onRetry`) only when reconnecting can help, and say why it is offline in `offlineReason` when you know.",
    ],
  },
  "joint-state": {
    wide: true,
    group: "Display",
    examples: { file: "joint-state", prefix: "JointState" },
    rules: [
      "For watching an arm's joints. It has nothing to press: jogging a joint is a control, with its own confirmation and a hold-to-run button.",
      "Pass the values as ROS sends them (radians and metres) with each joint's `unit`; the panel shows degrees and millimetres. Never convert before passing them, or the limits and the position will disagree.",
      "Give every joint its URDF `lower` and `upper`. Leave both out only for a continuous joint: it shows no track, and it can never be near a limit.",
      "Keep `margin` at 5 % of the range unless the arm's safety configuration sets its own soft limits; then pass that fraction, so the panel warns where the controller will.",
      "Pass `updatedAt` from the message's `header.stamp` when you have it: a robot that keeps publishing an old state still reads Stale. Keep `staleAfterMs` near three missed messages (1 s for a joint state at 10 Hz or faster).",
      "List the joints in chain order (base to tool), as the URDF does, not alphabetically.",
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
  banner: {
    group: "Feedback",
    examples: { file: "banner", prefix: "Banner" },
    rules: [
      "About the app, not one record: maintenance, read-only mode, a trial ending, no connection. A condition of one page or form is an Alert in the content; the result of what someone just did is a Toast.",
      "Full width, first in the page (or above the whole app), before the header in the DOM so it is read first. At most one at a time: show the most severe and let the next one wait.",
      "Tone by consequence: neutral for calm conditions, info only while a process runs (syncing back, a maintenance window under way), warning before something is lost, danger when the app cannot work. Danger is a tint, never solid red. Give it an icon that names the subject (Wrench, Lock, CloudOff).",
      "role=\"status\" for neutral, info and warning (read politely); role=\"alert\" only for danger. It is not role=\"banner\", which is the page header landmark.",
      "One action at most, named by its result (\"Choose a plan\", \"Retry now\"): a Button, size md, outline.",
      "Dismiss only when the condition does not need the person (news, a trial reminder). Remembering it is yours: onDismiss stores it, then pass open={false}. A condition that ends by itself (offline, read-only) has no close button and leaves when it ends.",
      "Above the AppShell: the shell is as tall as the screen unless --app-shell-height says otherwise. Put the banner and the shell in a column as tall as the screen (flex h-dvh flex-col) and wrap the shell in min-h-0 flex-1 [--app-shell-height:100%], so a banner that wraps on a phone never pushes the shell's bottom off screen.",
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
  tree: {
    group: "Navigation",
    examples: { file: "tree", prefix: "Tree" },
    rules: [
      "list (default) for a hierarchy people read and follow links in: lineage, an outline. select only when choosing a node is the job (a file explorer, a site picker): it is one Tab stop with arrow keys, and its nodes are not links.",
      "A node used twice (a source under two label sets) is named again with a marker in meta, \"(listed above)\", not drawn twice in full. When many nodes have several parents, it is a Graph.",
      "meta is a count, a size or a calm state word, in muted text; never a coloured status. A disabled node says why in its meta.",
      "Open what people came for (defaultExpanded or expandAll for short trees); a deep tree starts collapsed.",
      "Give textValue when label is not a string, so type-ahead and screen readers have its name.",
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
      "It floats 8 px from the screen's edges, the app shell's gutter, with every corner rounded. Set a width with w-* or sm:max-w-*; auto margins keep it on its side.",
    ],
  },
  popover: {
    group: "Overlays",
    examples: { file: "overlays", prefix: "Popover" },
    rules: [
      "A small control or a few facts tied to one trigger: a filter, a colour, a definition.",
      "More than a few fields, or a decision, is a Sheet or Dialog. A hint that needs no interaction is a Tooltip.",
      'The panel is a dialog, so it needs a name: aria-label on PopoverContent (usually the trigger\'s words, aria-label="Battery filter"), or aria-labelledby pointing at a heading inside it or at the trigger\'s id.',
    ],
  },
  "hover-card": {
    group: "Overlays",
    examples: { file: "hover-card", prefix: "HoverCard" },
    rules: [
      "Preview only. Hover does not exist on touch and screen readers are not told the card is there, so nothing in it may be the only way to a fact or an action: the trigger is a real link to the page that has it all.",
      "No controls inside: a button or link in the card cannot be reached reliably. Something to act on is a Popover (opened by a click) or the page itself.",
      "Keyboard focus on the link opens it, Esc or moving on closes it. It waits 500 ms before opening, so a pointer crossing a list does not flash cards.",
      "A few facts: a name, a state with its shape and word, a level as a Meter, when it was last seen. More than that is the page.",
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
      "Graphite and one accent: the series the reader should look at is --chart-1 (the brand indigo), the others graphite (2, 3), Other the light grey (4), a baseline or earlier period 5. Kept with the series when others are filtered out. Never a status colour as a series.",
      "Three series and Other at most: fold the rest into Other, highlight one and grey the rest, or split into small multiples.",
      "Line style follows the series order, set by the chart: solid, dashed (6 4), dotted (1.5 3.5). Pass strokeDasharray yourself only to override it.",
      "Filled marks (stacked bars, stacked areas) take the accent, then the mid grey (3) and Other (4): a large area in the strong grey (2) outweighs the accent, near-black in light and near-white in dark. The strong grey is for thin lines.",
      "No data is not zero. A missing value (null) takes the theme's `no-data` utility (a hatch and outline in the field-edge colour, 3:1), \"No data\" in the legend and tooltip, and a dash in the table; zero is drawn as zero.",
      "Two series or more: a legend above the plot, with each series' line style. One series: no legend; the title names it.",
      "Every chart with axes (line, area, bar, heatmap) has a table view (ChartTable), for exact values and for anyone who cannot tell two series apart. Sparklines, rings (radial) and status strips write their numbers in words instead.",
      "One y axis. Two measures on different scales are two charts.",
      "Lines 2 px; bars with 4 px rounded data ends and a 2 px gap in the card colour between bars and segments; a horizontal hairline grid; no axis lines.",
      "The chart fades in when it mounts (--motion-base); marks do not animate, because Recharts cannot use the motion tokens. Nothing moves under reduced motion.",
    ],
  },
  "robot-map": {
    group: "Charts",
    wide: true,
    examples: { file: "robot-map", prefix: "RobotMap" },
    rules: [
      "Offer RobotMapList beside every RobotMap, as a chart offers its table: a Map / List switch, the two side by side on a wide screen, or a Robots sheet over a full-screen map. The map is one Tab stop; the list is where each robot is reached by keyboard and screen reader. `lint:rules` asks for it in a block.",
      "Each layer keeps one job (Data visualisation, Maps and robot tracks): the floor and grid grey, zones as hairline outlines with an icon and a name and never a fill, the route being driven dashed blue (the one blue on the map), the track travelled solid grey.",
      "Robots are their status shape and name, as in every list; colour and the status word only for a robot that needs someone. Selection is a ring in the focus ring's ink and a bold name, never colour alone.",
      "Coordinates are metres from the plan's top-left corner, x to the right and y down, as the plan image is drawn. Convert from your map frame (ROS: y up, origin anywhere) before passing them.",
      "Bottom left holds zoom and the scale bar, so the emergency stop keeps the bottom right. Show the north arrow (`northDeg`) only when the plan is not drawn north up and people need it.",
      "No robots is said on the map, with the plan still shown; loading keeps the frame's size; an error says what failed and offers to reload.",
      "Up to a few hundred robots and zones: everything is redrawn on each pan. A city-scale map, tiles or GPS belong to a map library.",
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
  "context-menu": {
    group: "Overlays",
    examples: { file: "context-menu", prefix: "ContextMenu" },
    rules: [
      "A shortcut, never the only way: every action in it is also on a visible control (a ⋯ button with the same DropdownMenu, a toolbar, the detail page). Nobody can see that a context menu exists, and many tablets have no right-click.",
      "Touch: pressing and holding for 700 ms opens it (Radix does this). Keyboard: Shift+F10 or the Menu key on anything focused inside the trigger area; make the area focusable only if nothing in it is.",
      "Same items, same order as the visible menu. Destructive items go last, after a separator, in danger text.",
      "Submenus one level deep and short; ticks for options that switch on and off, a radio group for one of several.",
      "Leave the browser's own menu on text people copy and on links: put the trigger on the row or card, not on a field.",
    ],
  },
  // Robot shell
  "stop-button": {
    group: "Robot shell",
    examples: { file: "stop-button", only: ["Ready", "StopStates", "ConnectionStates", "WakeStates"] },
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
    examples: { file: "slide-to-release", only: ["Stopped", "ReleaseStates"] },
    rules: [
      "Letting go past 85% releases; short of that the thumb springs back in 200 ms.",
      "Viewers can see it but cannot release.",
      "Keyboard and switch control: hold Enter or Space for 2 s.",
      "If the robot does not release, set `failed`: the thumb goes back and the label says to slide again. Never leave it on Releasing….",
    ],
  },
  "teleop-pad": {
    group: "Robot shell",
    examples: { file: "teleop-pad", prefix: "TeleopPad" },
    rules: [
      "Dead man: the robot moves only while the stick is held. Release, a cancelled pointer, lost focus, a hidden page or `timeoutMs` without pointer events send a zero command at once and call onStop with the reason.",
      "Commands go out at a fixed rate (`rateHz`, 10 by default) while held, so the robot can run its own watchdog: if commands stop arriving for a few periods, the robot must stop by itself. The pad cannot stop a robot whose link or tab has frozen.",
      "Pressing never moves the robot: the stick starts where the finger lands, and only movement from there drives. A dead zone (10 % by default) keeps a resting thumb from creeping it.",
      "Not an emergency stop. Put StopButton beside it, above it on a phone, on every drive screen; the pad has no red.",
      "`maxSpeed` caps what full stick sends, and the pad draws its scale; the app still enforces the robot's own limits.",
      "Disabled says why (`disabledReason`), in words beside a lock, and keeps its size so nothing jumps when autonomy hands back.",
      "Outputs follow ROS REP 103: linear forward is +, angular left (counter-clockwise) is +, both −1…1 of top speed.",
    ],
  },
  dock: {
    group: "Robot shell",
    examples: { file: "dock", only: ["Moving", "DockRobotStates", "DockActionStates"] },
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
      "Failure notices stay until handled. A persistent fault (stopped) changes the tray edge colour; offline stays neutral and is said in words and by its shape.",
      "IslandAlarm shows the most urgent unacknowledged alarm above any notice, from the same data as AlarmList. The edge follows it: critical danger, high warning.",
      "On a phone the island is the alarm surface, so it buzzes, sounds (critical repeats until acknowledged) and announces new alarms, like AlarmList. Turn `feedback` off on one of them when both are on screen.",
    ],
  },
  tray: {
    group: "Robot shell",
    examples: { file: "hooks", prefix: "Tray" },
    rules: ["Rows inside are radius 16 (md), so their corners stay concentric with the tray's 24. Dock and Dynamic island are built on it."],
  },
  // Hooks: each has a small live demo; the source is in the Source sheet.
  "use-long-press": {
    group: "Hooks",
    examples: { file: "hooks", prefix: "UseLongPress" },
    rules: ["Returns hold progress from 0 to 1. The emergency stop uses it for hold-to-stop-all."],
  },
  "use-slide-release": {
    group: "Hooks",
    examples: { file: "hooks", prefix: "UseSlideRelease" },
    rules: ["Drag, threshold and spring-back logic behind Slide to release."],
  },
  "use-presence": {
    group: "Hooks",
    examples: { file: "hooks", prefix: "UsePresence" },
    rules: [
      "Keeps an element (usePresence) or list items (usePresenceList) mounted while they leave, so an exit plays disappear instead of vanishing.",
      "It is how alarms fade out of a list and a save bar leaves after Save: not for anything that should simply hide at once.",
    ],
  },
  "use-hotkeys": {
    group: "Hooks",
    examples: { file: "hooks", prefix: "UseHotkeys" },
    rules: [
      "Single keys only where people work through a queue by keyboard (1 Yes, 2 No, ? help); everywhere else a shortcut takes a modifier (mod+k).",
      "Keys are ignored while someone types in a field, unless a binding sets allowInInput (Escape, mod+s).",
      "Turn it off with enabled: false while a dialog is open, so the dialog's own keys win.",
      "Show the keys on screen (Kbd) and in a ? dialog: a shortcut nobody can find does not exist.",
    ],
  },
  "use-debounce": {
    group: "Hooks",
    examples: { file: "hooks", prefix: "UseDebounce" },
    rules: [
      "Debounce what goes to a server (a search, an autosave), never what the person sees: the text box updates on every key.",
      "300 ms for typing. A clear button and Enter do not wait: cancel() or flush().",
      "Answers can return out of order: keep only the one for the latest query.",
    ],
  },
}

export type Item = (typeof registry.items)[number] & Entry

// What each component does with the keyboard beyond Tab. Radix supplies most of it; these tables say so out loud.
const keyboard: Record<string, [string, string][]> = {
  alarm: [
    ["Tab", "Move through each row's buttons, in the list's order (most urgent first)"],
    ["Enter / Space", "Acknowledge; focus moves to the next Acknowledge, or to the list's heading after the last"],
    ["Enter / Space on a group", "Open or close the folded low alarms or the shelved group"],
  ],
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
    ["Enter / Space", "Open the list of slots (TimePicker)"],
    ["Tab", "In the list: one stop, on the picked slot (or the first free one)"],
    ["↑ / ↓", "Previous or next free slot"],
    ["Page Up / Page Down", "Six slots back or forward"],
    ["Home / End", "First or last free slot"],
    ["Enter / Space", "Pick the focused slot and close"],
    ["Esc", "Close and return focus"],
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
  graph: [
    ["Tab", "Move into the graph (one stop, on the selected node or the first) and out"],
    ["→ / ←", "Horizontal: to an output / to an input of the focused node (the nearest one, or back where you came from)"],
    ["↓ / ↑", "Horizontal: next or previous node in the same column. Vertical: ↓ / ↑ follow the edges and ← / → move in the row"],
    ["Home / End", "First or last node"],
    ["Enter", "Select the node and highlight its path, or follow it when it is a link"],
    ["Space", "Select the node, links included"],
    ["Esc", "Clear the selection"],
  ],
  "robot-map": [
    ["Tab", "Move into the map (one stop), then to its zoom buttons"],
    ["← / → / ↑ / ↓", "Move the map"],
    ["+ / -", "Zoom in or out"],
    ["0", "Show the whole site"],
    ["Esc", "Clear the selection"],
  ],
  tree: [
    ["Tab", "list: move between links and disclosure buttons. select: move into the tree (one stop) and out"],
    ["Enter / Space", "list: open or close a branch, follow a link. select: select the focused node"],
    ["↑ / ↓", "select: previous or next node on screen"],
    ["→", "select: open a closed branch; on an open one, move to its first child"],
    ["←", "select: close an open branch; otherwise move to the parent"],
    ["Home / End", "select: first or last node on screen"],
    ["Type letters", "select: move to the next node whose name starts with them"],
    ["*", "select: open every branch beside the focused node"],
  ],
  "image-grid": [
    ["Enter / Space", "Open the picture in the lightbox, or pick it while picking"],
    ["← / →", "In the lightbox: previous or next picture"],
    ["Esc", "Close the lightbox and return focus to the picture's tile"],
  ],
  "media-player": [
    ["Space / K", "Play or pause (Space on a focused button presses that button)"],
    ["← / →", "Back or forward 5 seconds, also on the timeline"],
    ["J / L", "Back or forward 10 seconds"],
    ["Home / End", "On the timeline: start or end of the clip"],
    ["M", "Mute or unmute"],
    ["F", "Full screen, or leave it (Esc leaves it too)"],
  ],
  "camera-feed": [
    ["Space", "Pause or resume the view (Space on a focused button presses that button)"],
    ["F", "Full screen, or leave it (Esc leaves it too)"],
  ],
  "annotated-image": [
    ["Tab", "Reach the picture's annotations once; Tab again leaves"],
    ["← → / ↑ ↓", "Previous or next annotation, top to bottom and left to right"],
    ["Home / End", "First or last annotation"],
    ["Enter / Space", "Select the annotation"],
    ["Esc", "Clear the selection"],
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
  "code-block": [
    ["Tab", "Move to Show (a secret), Copy, then the code when it scrolls"],
    ["← / →", "Scroll the focused code sideways"],
    ["Enter / Space", "On Show, show or hide the secret; on Copy, copy the code"],
  ],
  filters: [
    ["Enter", "On + Filter, open the picker; on a part of a chip, reopen that step"],
    ["↑ / ↓", "Move through fields, operators or values; type to narrow them"],
    ["Enter", "Choose and go to the next step; in a value box, apply"],
    ["Esc", "Back one step; at the first step, close and return focus"],
  ],
  "dropdown-menu": [
    ["Enter / Space / ↓", "Open the menu"],
    ["↑ / ↓", "Move between items"],
    ["Enter", "Run the item"],
    ["Esc", "Close and return focus"],
  ],
  "context-menu": [
    ["Shift+F10 / Menu key", "Open the menu for the focused row or area"],
    ["↑ / ↓", "Move between items"],
    ["→ / ←", "Open or close a submenu"],
    ["Enter / Space", "Run the item, or tick it"],
    ["Esc", "Close and return focus"],
  ],
  "hover-card": [
    ["Focus", "Show the card after a moment"],
    ["Esc / Tab away", "Hide it"],
    ["Enter", "Follow the link"],
  ],
  banner: [["Enter / Space", "On the action, run it; on the close button, dismiss the notice"]],
  toast: [
    ["F8", "Move focus to the notifications"],
    ["Esc", "Dismiss the focused notification"],
  ],
  "stop-button": [
    ["Enter / Space", "Stop this robot"],
    ["Hold Enter / Space 2 s", "Stop all robots"],
  ],
  "slide-to-release": [["Hold Enter / Space 2 s", "Release"]],
  "teleop-pad": [
    ["Hold ↑ / W, ↓ / S", "Drive forward, back"],
    ["Hold ← / A, → / D", "Turn left, right (with ↑ or ↓, curve)"],
    ["Release every drive key", "Stop"],
    ["Space / Esc", "Stop; keys still held do nothing until released"],
    ["Tab away", "Stop"],
  ],
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
