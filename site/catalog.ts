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
  | "log-viewer"
  | "streaming-text"
  | "message-scroller"
  | "prompt-composer"
  | "message-actions"
  | "message"
  | "markdown"
  | "citations"
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
  | "code"
  | "code-block"
  | "button-group"
  | "scroll-area"
  | "toggle-group"
  | "page-header"
  | "section-header"
  | "responsive-table"
  | "chip-group"
  | "facets"
  | "filter-form"
  | "filters"
  | "search-field"
  | "theme-toggle"
  | "route-progress"
  | "data-pieces"
  | "image-grid"
  | "annotated-image"
  | "grounded-text"
  | "media-player"
  | "camera-feed"
  | "camera-wall"
  | "joint-state"
  | "diagnostics"
  | "tree"
  | "collapsible"
  | "sidebar"
  | "graph"
  | "robot-map"
  | "waypoint-editor"
  | "geo-map"
  | "point-cloud"
  | "robot-model"
  | "hooks"
  | "metric-card"
  | "context-menu"
  | "hover-card"
  | "banner"
  | "streaming-chart"
  | "attitude"
  | "tier-badge"
  | "bar-list"
  | "thumbnail"
  | "viewport-overlay"
/** Stories whose export name starts with `prefix` (or exactly `only`). Overlay stories ending in "Open" are for visual tests and skipped. */
type Examples = { file: StoryFile; prefix?: string; only?: string[] }

// Robotics third: after the two groups every product reaches for first, and before the general ones, as the kit's reason to exist.
// The robot shell (dock, island, tray) is part of it, after the stop. Then what a data screen is made of, from the rows to
// the values in them: lists and tables, status and values, search and filters, then the rest of data display. AI holds the
// parts of a conversation with a model or an agent, from the answer's text to the box that sends the next question. No group
// holds more than about twenty, so each reads as one choice in the sidebar.
export const groups = [
  "Actions",
  "Inputs",
  "Robotics",
  "Lists & tables",
  "Status & values",
  "Search & filters",
  "Data display",
  "AI",
  "Charts",
  "Media & files",
  "Feedback",
  "Navigation",
  "Overlays",
  "Layout",
  "Hooks & libraries",
] as const
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
  ["`Esc`", "Close and return focus to the control that opened it"],
  ["`Tab` / `Shift`+`Tab`", "Move between controls inside; focus stays inside until it closes"],
]

const entries: Record<string, Entry> = {
  graph: {
    group: "Data display",
    wide: true,
    examples: { file: "graph", prefix: "Graph" },
    rules: [
      "For a node with several inputs: lineage, a training run's inputs and outputs, a mission's parallel steps. When every node has one parent, use a Tree.",
      "Offer GraphList beside it (a Graph / List switch), as a chart offers its table: the same nodes as text, inputs before what they feed. On a phone the list reads without scrolling sideways, so start there on the list.",
      "Up to about 60 nodes. A bigger graph needs a dedicated layout library and panning; show a part of it (one node's lineage) instead.",
      "Edges are neutral; the selected node's path is drawn in the ink colour and the rest steps back. No colours per edge or per kind of node.",
      "Status is a shape and a word; only warning and danger are coloured. Steps that did not run are grey and say so (\"Not run\").",
      "Names fit a box: about 28 characters show in full, longer ones end in an ellipsis. Put the detail in meta, one short line.",
      "A category that is not a state (an access tier, \"Deprecated\", a version channel) is a `badge`: a neutral outline tag after the name, a word or two, read after the name. Never a colour per tag.",
      "Columns come from the layout (each node one column after its latest input), not from kinds, so they have no headings. Say what the graph holds in its title, and what each node is in its name or badge.",
    ],
  },
  trace: {
    wide: true,
    group: "AI",
    examples: { file: "trace", prefix: "Trace" },
    rules: [
      "Done steps are a neutral check; only warnings and failures are coloured.",
      "An `icon` for the kind of step replaces the done check only: running, warning, failed, waiting and skipped steps keep their mark.",
      "A failed step says why in its description; the raw error goes in a TraceCode inside it.",
      "Open the step that needs attention by default, nothing else.",
      "`total` plus each step's `start` and `duration` draw the waterfall; leave them out for a plain list.",
    ],
  },
  marker: {
    group: "Data display",
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
    group: "Data display",
    examples: { file: "timeline", prefix: "Timeline" },
    rules: [
      "Plain events get a neutral dot. Only a warning or danger event is coloured, and only its mark (the glyph, or the icon you pass): the title stays in the text colour.",
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
    group: "Lists & tables",
    examples: { file: "data-grid", prefix: "DataGrid" },
    rules: [
      "Build the table with `useTable`, with `dataGridFeatures` in its features; `DataGrid` draws it.",
      "Keep data and columns stable (module scope or useMemo). A new array each render loops once a row expands.",
      "Numbers right-aligned (`meta.align`) and tabular.",
      "Status cells use `InlineStatus`, never a coloured badge.",
      "A `virtual` grid needs a `maxHeight`.",
      "A resizable column is resized by dragging its edge, by the arrow keys on the edge, or from its menu (Wider, Narrower, Reset width), so touch and keyboard need no drag.",
      "Pin one column, the one that names the row. Pinning holds from 448 px wide; on a phone every column scrolls.",
      "A row that cannot be selected says why: selectColumn's `reason`, and a line beside the grid.",
      "An expanded row is already a surface: a DescriptionList inside it is `variant=\"bare\"`, never a card in the row.",
    ],
  },
  "log-viewer": {
    wide: true,
    group: "Lists & tables",
    examples: { file: "log-viewer", prefix: "LogViewer" },
    rules: [
      "For lines a program writes as it runs: ROS /rosout, journald, a service's log. Events people act on are `alarm`; a table people sort and page is `data-grid`; one run's steps are `trace`.",
      "Stream through `createLogBuffer` (pass it as `buffer`) or the `ref` handle's `append`, never by copying a growing array into state: appends are batched, so 1,000 lines a second draw ten times a second. Convert ROS messages with `rosLogToLogLine` from `ros`.",
      "Set `maxLines` to what the reader needs to scroll back through (10,000 by default); the oldest lines are dropped. Up to about 200,000 stay smooth; keep the full log on disk or in the backend.",
      "Levels are a shape and a word, never a tinted row: warn is warning, error and fatal danger; debug and info stay grey.",
      "Give `timeZone` when the people reading are not where the robot is, and say which in the page; copied lines are always ISO 8601 in UTC.",
      "Name the sources for what they are: `labels.sources` \"Nodes\" for ROS, \"Units\" for journald.",
      "Leave `announce` on \"errors\" (at most every 5 s); \"all\" only for a slow log, and false where an alarm already speaks for the same failure.",
      "An opened line is a band of its row, not a card: a hairline under the message, the fields with names under the time and values under the level, and one quiet Copy line. Nothing floats over the lines: Jump to latest and Copy for several lines sit in the footer.",
    ],
  },
  "streaming-text": {
    wide: true,
    group: "AI",
    examples: { file: "streaming-text", prefix: "StreamingText" },
    rules: [
      "For one answer that a model streams token by token: a VLM's caption, count or answer to a query, an LLM's reply. Numbers over time are `streaming-chart`; lines a program writes are `log-viewer`.",
      "Append each chunk to one string and pass it as `text` with the `phase`. Plain text by default (blank lines start paragraphs); `format=\"markdown\"` when the model writes Markdown, so it renders as headings, lists, tables and code while it streams and is read aloud without its syntax.",
      "Set `phase` from the request: \"queued\" with `queuePosition` (1 is next), \"streaming\", then \"done\", \"stopped\" or \"error\" with `error` in words. Stopped and failed keep the partial text and say it is incomplete.",
      "Give `onStop` and abort the request in it, then set \"stopped\". Give `onRetry` for an error. Try again shows only after an error, never after Stop, so a second tap on Stop cannot start a new answer.",
      "Pass `startedAt`, `firstTokenAt` and `finishedAt` (or the server's `durationMs` and `firstTokenMs`): done says \"Done in 2.4 s · first token 0.3 s\". Without them it says Done.",
      "A reasoning part goes in `reasoning`, never into `text`: it streams first, sits apart behind a Reasoning button, closed, and the status says Thinking until the answer starts.",
      "Calm while it waits: grey Spinner and a word, no blinking caret, no blue. Colour only on an error's glyph and word.",
      "Leave `announce` on \"text\": screen readers hear each phase once and the answer in whole sentences, at most every 5 s. \"status\" where the answer is read elsewhere.",
    ],
  },
  message: {
    wide: true,
    group: "AI",
    examples: { file: "message", prefix: "Message" },
    rules: [
      "One turn of a conversation with a model or an agent. Map your API's `role` straight to `role`: user, assistant, tool or system.",
      "Who spoke is the role word in the header (You, Assistant, Tool, System), with `name` after it (the person, the assistant, the tool called). Never tell roles apart by a bubble colour or by alignment alone: `align=\"end\"` may move a person's turns to the end of a wide container, and they keep the word.",
      "Every turn is on neutral ground. A person's turn has a quiet `surface` (muted) by default; nothing takes a colour for its role.",
      "Pass `time` already formatted (\"14:02\") and `dateTime` for machines. Format it once in the browser, or with a time zone, so the server and the page agree.",
      "The body is `children`: StreamingText for a streamed answer, Trace for tool calls, Attachment for files, your markdown renderer. Message parses nothing.",
      "While the answer arrives set `status=\"streaming\"` (aria-busy). When the body is StreamingText, leave the final state to it (its status row says Done, Stopped or Failed) and clear `status`; use Message's `error` and `stopped` for a turn whose body cannot say it, such as a person's turn that was not sent.",
      "Facts about the answer go in `footer` with `MessageMeta` (model, duration, tokens, numbers through format-number); its actions go in `actions` (`message-actions`).",
      "The same speaker's next turn takes `continued`: the header stays for screen readers only. Put the turns in a `message-scroller`.",
    ],
  },
  "message-actions": {
    group: "AI",
    examples: { file: "message-actions", prefix: "MessageActions" },
    rules: [
      "The actions under a model's answer, in Message's `actions`. Each part shows only when you give what it needs: `copyText` for Copy, `onRegenerate` for Regenerate, `onFeedbackChange` for Good and Bad, `versions` above 1 for the switcher.",
      "Good and Bad are toggles (aria-pressed), inverted when pressed like every selected control, never green or red. Pressing the pressed one again clears it.",
      "Give `reasons` to ask what was wrong after Bad: a few short ones (\"Wrong facts\", \"Did not follow the request\"). Send the feedback and the reason from `onFeedbackChange` and `onReasonChange`.",
      "Regenerating adds a version: pass `version` and `versions` and switch the shown answer in `onVersionChange`. The switcher's ends stay focusable and say they are the end.",
      "`quiet` (on by default) keeps the buttons out of sight until the turn is hovered or focused, with a mouse only: touch screens and keyboards always see them. Set it false on the latest answer. Feedback that was given and the switcher never hide.",
      "Every button is an icon with its name in `aria-label`; 36 px with a mouse, 44 on touch.",
    ],
  },
  "prompt-composer": {
    wide: true,
    group: "AI",
    examples: { file: "prompt-composer", prefix: "PromptComposer" },
    rules: [
      "Where someone writes to a model or an agent. It is a real <form>: `onSubmit(text, files)` gets the trimmed text and the attached files; return false to keep the draft (say why beside it).",
      "Enter sends and Shift+Enter starts a new line. Enter that ends an input method's composition (Zhuyin, Cangjie, Pinyin, kana) only commits the characters: never send on it in your own handlers either (`isComposingEnter`).",
      "While the answer streams pass `streaming` and `onStop`: Send becomes Stop in the same place and size, with focus kept, and Enter does not send. Abort the request in `onStop`.",
      "Never a greyed Send without a reason: an empty box, an answer still streaming and a passed `maxLength` are said in words under the box and in Send's description. `disabled` takes `disabledReason` (offline, no access).",
      "`allowFiles` adds the attach button, paste and drop; `accept`, `maxSize` and `maxFiles` are checked as in file-upload and refused files are named with the reason. The files show as Attachment chips above the text.",
      "`maxLength` shows the count (\"120 / 4,000\"); past it the box and the count take the danger edge and words, and Send waits. Nothing is cut off.",
      "Put a model select or a context chip in `toolbar`, beside the attach button. The composer has no fixed positioning: pin it with the page's layout (see the overview).",
    ],
  },
  "message-scroller": {
    wide: true,
    group: "AI",
    examples: { file: "message-scroller", prefix: "MessageScroller" },
    rules: [
      "The scrolling box of a conversation: Message turns as its direct children, oldest first. Give it a height (`className`: h-96, or min-h-0 flex-1 in a column).",
      "It follows the newest turn while the reader is at the bottom, also while an answer streams, and lets go the moment they scroll up. Do not scroll it yourself as tokens arrive.",
      "Jump to latest shows whenever the reader is away from the bottom, with how many turns came since (\"3 new\"); it glides back, or jumps under reduced motion, and leaves focus on the conversation.",
      "Sending a turn of one's own (a Message with `role=\"user\"` appended) always goes back to the bottom.",
      "Older turns: `hasEarlier` and `onLoadEarlier` show Load earlier at the top; put the older turns in front of `children` and the view stays where it was.",
      "Leave the reading to it: the log's own live region is off, StreamingText reads answers in sentences, and the scroller reads a turn once only when it arrives complete. Never add aria-live to the turns.",
      "Pass `empty` for a new conversation: an EmptyState, with suggested prompts as chips.",
    ],
  },
  markdown: {
    wide: true,
    group: "AI",
    examples: { file: "markdown", prefix: "Markdown" },
    rules: [
      "For text a model wrote in Markdown: an assistant's answer, a summary, a generated report. A streamed answer is StreamingText with `format=\"markdown\"`, which renders through this and reads it aloud; use Markdown alone for an answer that is already whole, or inside your own message layout.",
      "A safe subset, never HTML: tags show as the text they are, links go only to http(s) and mailto (anything else, a relative path included, is its words), and pictures are a link with their alt text. Name the origins pictures may load from in `imageOrigins`, and only ones you serve or trust.",
      "Pass the growing text with `streaming` while it arrives, and turn it off at the end: an unclosed ** styles its words, a link shows its words until its URL is whole, and a table waits for its delimiter line, so nothing half-written flashes. Keep `cite` and `labels` stable (a module constant), so finished blocks are not drawn again.",
      "Headings start at `headingLevel` (h3, under a page's h1 and a section's h2) and never skip a level, whatever the model wrote. Set it from where the answer sits in the page.",
      "Code fences are the kit's CodeBlock with Copy and the language, without highlighting; tables are the kit's Table and scroll sideways when wider than the column. Links open in a new tab by default and say so to screen readers.",
      "It never speaks on its own. For citations, pass `cite={citationMarker}` inside `Citations`: [1] and [^1] in the text become markers linked to the sources list.",
    ],
  },
  citations: {
    wide: true,
    group: "AI",
    examples: { file: "citations", prefix: "Citations" },
    rules: [
      "For an answer built from documents (retrieval): each claim's sources as numbered markers in the text, and the list of them under the answer. Words that point at places on a picture are `grounded-text`.",
      "Pass the sources in the order the model numbers them: [1] is the first. Put the answer and `CitationSources` inside one `Citations`; in Markdown, `cite={citationMarker}` turns [1], [^1] and [1, 2] into markers. A number with no source stays the text [N].",
      "Give each source a `title` and an http(s) `url`, or a `location` (a file and page, a manual's section) when it is not a web page; a `snippet` is the passage the answer used, a sentence or two.",
      "Neutral: the markers and their highlight are the kit's quiet fill and inverted number, never a colour per source. A title with a URL opens in a new tab with the external-link icon, and says so to screen readers.",
      "Activating a marker moves focus to its source, which shows \"Back to citation N\"; that button or Esc returns to the marker. Keep the list on the same page as the answer, under it.",
      "Inside StreamingText, wrap the StreamingText and the list in `Citations` and pass `markdownProps={{ cite: citationMarker }}`: the markers appear as the answer streams, and the reading leaves them out.",
    ],
  },
  sortable: {
    group: "Lists & tables",
    examples: { file: "sortable", prefix: "Sortable" },
    rules: [
      "Only the handle drags; the rest of the row stays clickable.",
      "Give getLabel so moves are announced by name.",
      "Keyboard: Space to lift, arrows to move, Space to drop, Esc to cancel.",
    ],
  },
  resizable: {
    wide: true,
    group: "Layout",
    examples: { file: "resizable", prefix: "Resizable" },
    rules: [
      "Set minSize so a panel never collapses into nothing by accident.",
      "withHandle on touch screens, where a thin line is hard to find.",
      'A number is a percentage of the group; give a unit for anything else ("240px", "20rem").',
    ],
  },
  "file-upload": {
    group: "Media & files",
    examples: { file: "file-upload", prefix: "FileUpload" },
    rules: ["Say what is accepted and how big, in the hint.", "Report refused files by name and reason.", "Show what was taken as Attachment rows."],
  },
  attachment: {
    group: "Media & files",
    examples: { file: "attachment", prefix: "Attachment" },
    rules: ["An error says why in words and offers Retry.", "Remove is always the last action, and names the file for screen readers."],
  },
  "file-type": {
    group: "Media & files",
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
    group: "Lists & tables",
    examples: { file: "item", prefix: "Item" },
    rules: [
      "One row per thing: a person, a file, a service, a setting link.",
      "Only a link draws the hover fill; a static row never looks clickable.",
      "Robot rows with a live status use the shell's List.",
    ],
  },
  "icon-tile": {
    group: "Data display",
    examples: { file: "icon-tile", prefix: "IconTile" },
    rules: [
      "Neutral by default. A tone only when the tile states a status.",
      "Tones are neutral, warning and danger: a tile stays on screen, so it is a state, and a calm state is grey. There is no info or success tone (removed in 0.40).",
      "Never solid red: a solid danger tile stays on its tint, since solid red belongs to the emergency stop.",
      "Icons inside are 16, 20 or 24 px; the size prop sets them.",
      "Every icon on a tile is an IconTile (an empty state, a status page, a confirmation, a menu card, a row's media): never a hand-made square, whose size and corner drift. sm 32 px with an 8 px corner, md 40 and lg 48 with 12, xl 64 with 16.",
      'An icon, never words: a robot\'s ID or initials on a tile is an Avatar (`shape="square"`), which takes the same corners.',
    ],
  },
  "text-diff": {
    group: "Data display",
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
    group: "Data display",
    examples: { file: "kbd", prefix: "Kbd" },
    rules: [
      "One key per Kbd; a chord is a KbdGroup without plus signs. How it is pressed (Hold, Double-press) is a word beside the key, not a Kbd.",
      "Use the platform's symbols: ⌘ on Mac, Ctrl elsewhere. `useModKey()` gives the right one.",
      "`pressed` shows the key going down (it sinks and its edge darkens) while its shortcut runs; `useHotkeys` returns which key that is.",
    ],
  },
  code: {
    group: "Data display",
    examples: { file: "code", prefix: "Code" },
    rules: [
      "A path, a key, a version tag or a command inside a sentence or a cell. Code on its own lines is a CodeBlock; a key to press is a Kbd.",
      "It takes the size of the text around it; never give it a size of its own.",
      "No copy button inside. For a reference people paste, put a CopyButton beside it.",
      "Words, not values to edit: a value someone changes is an Input.",
    ],
  },
  "code-block": {
    group: "Data display",
    examples: { file: "code-block", prefix: "CodeBlock" },
    rules: [
      "Copy copies `code` exactly, whatever the block shows: highlighted children, wrapped lines or a hidden secret.",
      "`wrap=\"words\"` for shell commands, so a phone never cuts a package name in two; `wrap=\"none\"` for source, which scrolls sideways with a fade on the side that hides text.",
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
    group: "Layout",
    examples: { file: "scroll-area", prefix: "ScrollArea" },
    rules: ["Give it a fixed height (or width) and an aria-label.", "The viewport takes focus so the keyboard can scroll it."],
  },
  "page-header": {
    group: "Layout",
    examples: { file: "page-header", prefix: "PageHeader" },
    rules: [
      "One per page, first in the content: the breadcrumb says where, the h1 says what. No label above the title.",
      "A state (the robot's, the job's, the dataset's) goes in `status`: one `InlineStatus` beside the title, at most one, never a pill or a badge. Fixed attributes (Production as an outline, Beta, a version) go in `badges`, after it.",
      "Meta pills are facts (counts, owner, last update), never a state: a state in a boxed pill reads as one more fact, so it goes in `status`. MetaPill has no tone.",
      "A fact that leads somewhere (\"2 compliance items open\" to that tab) takes `href` (and `linkAs` for your router): the pill becomes an underlined link with the focus ring and a 36 px target (44 on touch), the same height on screen. Never wrap a pill in your own link.",
      "Actions sit at the right; the page's one primary action may be among them.",
    ],
  },
  "section-header": {
    group: "Layout",
    examples: { file: "section-header", prefix: "SectionHeader" },
    rules: [
      "Two levels, from typography: `page` (20 px bold) for a section of the page, outside the cards; `surface` (14 px medium, never bold) for a section inside a card, a sheet or a panel. Never another size or weight for a section title.",
      "The heading is an h2 at `page` and an h3 at `surface`. Set `as` so the page's outline skips no level; the look stays the same.",
      "`count` is how many items the section holds, written in full with grouping (1,284, never 1.2K), muted after the title. A count that needs someone (unread, failing) is a CountBadge in the title instead.",
      "Actions are the section's own (View all, Add): at the right, under the title when the title needs the width. `size=\"sm\"` buttons in a `surface` header.",
      "A card that shows data (a chart, a figure) opens with CardDataHeader; a page opens with PageHeader. Give the section `aria-labelledby` with the heading's `id`.",
    ],
  },
  "chip-group": {
    group: "Search & filters",
    examples: { file: "chip-group", prefix: "ChipGroup" },
    rules: [
      "One choice among several, with the count each gives. `type=\"multiple\"` for any of several values in one facet (\"detection or segmentation\"); `value` is then a list. For a long list of options use checkboxes in a FieldSet.",
      "Selected is inverted, like a selected segment.",
      "Fold long rows with max; chosen chips always stay visible.",
      "Chips with href are links: the filter lives in the URL and works without JavaScript. The chosen link is aria-current=\"page\"; give `current=\"true\"` to a row of filter links on a page whose navigation already marks the page. With `type=\"multiple\"` each link's href adds or removes its value, and chosen links say \"selected\" instead.",
      "`props` on a chip puts `data-*` hooks, a `title` or `aria-describedby` on its button or link.",
    ],
  },
  facets: {
    wide: true,
    group: "Search & filters",
    examples: { file: "facets", prefix: "Facets" },
    rules: [
      "The facet column beside a catalog or a table: a few questions (tier, task, site), each a group of checkboxes, any of which can be on. Options in one facet combine with OR, facets with AND; the page filters, the facets only hold the picks.",
      "Give every option its `count`, how many rows have it, computed by the page or the query. Pass `locale` so counts are grouped as on the server.",
      "`Facets` is the column from 1024 px; put `FacetsDrawer` in the toolbar for smaller screens and give both the same `value` and `onValueChange`. Never a second, hand-made sheet of checkboxes.",
      "The column pins under the shell's bar (`--shell-top`) and scrolls on its own when it is taller than the space under it, so the list beside it scrolls without taking the filters away.",
      "`max` folds a long facet after that many options with \"Show all N\"; picked options always stay in view. A facet's own `max` wins.",
      "Picks apply at once, in the column and in the drawer; the drawer's Done only closes it. Say what they leave (\"12 of 40 recordings\") beside the list, in a polite live region.",
      "A drawer opened from its button moves focus into the sheet. One that opens on load (`defaultOpen`, a preview) passes `onOpenAutoFocus={(e) => e.preventDefault()}` so the page keeps its focus.",
      "A query people build from any field and operator is `filters`; one facet as a row of chips above a list is `chip-group`.",
    ],
  },
  "filter-form": {
    group: "Search & filters",
    examples: { file: "filter-form", prefix: "FilterForm" },
    rules: [
      "Filters that change what a page lists belong in the URL: shareable, bookmarkable, undone with Back.",
      "Typing applies a moment after it stops; a pick applies at once. The page number resets.",
      "It is a plain GET form, so it works before JavaScript loads. Pass onNavigate to stay client-side (Next.js: router.push / router.replace with scroll: false).",
    ],
  },
  filters: {
    group: "Search & filters",
    examples: { file: "filters", prefix: "Filters" },
    rules: [
      "For a query people build themselves: any field, any number of rules. For a few fixed facets use Chip group or Filter form.",
      "Rules combine with AND, and the bar says so between the chips. There are no groups and no OR.",
      "Keep the rules in the URL with toSearchParams and fromSearchParams, so a filtered view can be shared and undone with Back.",
      "Show what the rules leave (\"12 of 40 robots\") next to the bar, in a polite live region.",
      "Every label is a prop; translate the operators too.",
      "Saved views are `FilterViews` above the bar, given the same rules. The view whose rules equal them is chosen (order does not matter); change a rule and it says Modified, with Reset. `onSave` adds Save view, which asks for a name; storing the views is the app's job.",
    ],
  },
  "search-field": {
    group: "Search & filters",
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
      'type="single" only for a tool or a mode: what the next tap on a map does, a drive mode. type="multiple" for layers, channels or filter chips.',
      "A view of the data, a sort order or a time window (1 h, 24 h, 7 days) is not a tool: use Segmented control.",
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
    rules: [
      "For two to four views of the same data, a time window (1 h, 24 h, 7 days), or a setting with two to four short choices that applies at once or is saved with its form (Auto / Ask / Blocked). For sections of a page, use Tabs; for a tool or a mode, Toggle group.",
      "The selected segment is inverted, per the selected-state rule.",
      "A switch in a card's header (Chart / Table, Map / List) is `ChartViewSwitch`, at `--h-sm` (36 px with a mouse, 44 on touch): a header holds no field. Beside a search or a select the toolbar is the field's `--h-md`; use SegmentedControl at its default height there.",
    ],
  },
  "copy-button": {
    group: "Actions",
    examples: { file: "actions", prefix: "CopyButton" },
    rules: [
      "The icon becomes a check for 1.5 s and the label says Copied: the swap pattern, never a toast.",
      "Icon-only needs a label that names what is copied (Copy reference).",
      "A text button keeps the width of its longest word (Copied, Not copied) so it never jumps; the word starts 8 px after the icon and the room left over falls after it.",
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
    group: "Status & values",
    examples: { file: "display", prefix: "Badge" },
    rules: [
      "A fixed attribute or category: a tier, a data use, an environment, a version, Beta. A state that changes (a robot's status, a job's state) is `status-eyebrow`'s `InlineStatus`, in a row or a header; a count is a `CountBadge`.",
      "In a table column whose header already names the attribute, the values are plain text, not a badge on every row. A page header shows at most one status, then its badges after the title.",
      "Test and audit results are a `ResultBadge`: `result=\"passed\"` (grey with a check), `\"failed\"` (danger outline) or `\"insufficient\"` (grey, dashed circle). Never a green pass.",
      "Neutral (the default) or `outline` (the environment: Production, Staging). There are no status tones (removed in 0.40: `tone=\"warning\"` is a type error). A state in a tinted box is the mistake the Do / Don't example shows; it is an `InlineStatus`.",
    ],
  },
  "tier-badge": {
    group: "Status & values",
    examples: { file: "tier-badge", prefix: "TierBadge" },
    rules: [
      "A dataset's licence tier, wherever the dataset is named: a row, a page header, a release check.",
      "With its words by default; `compact` (the code alone) only in a column headed Tier. Screen readers hear the words either way.",
      "T0 is grey, the restricted tiers outlined. A tier is a category, not a state: never a status colour, never red for T3.",
    ],
  },
  card: {
    group: "Layout",
    examples: { file: "display", prefix: "Card" },
    rules: [
      "Never nest cards. Group rows inside one card with separators.",
      "The title is an h3. Set `as` on CardTitle (`titleAs` on CardDataHeader) to the level the page needs: h2 for a card right under the h1, h4 inside a section under an h3. The size stays the same.",
      "A cover picture is CardMedia, first in the card: edge to edge, its top corners the card's own (`rounded-[inherit]`), 16:9 unless `aspect` says otherwise. `inset` keeps it inside the padding at the image radius (12). Never round the picture yourself.",
      "A media card (a gallery of collections) is a pattern, not a component: CardMedia with one cover or a mosaic of up to four Thumbnails (`className=\"flex size-full rounded-none\"`), the title as the card's one link (metric-card's stretched link: `after:absolute after:inset-0` on the link, the ring on the card, the title underlined while the card is hovered, as every link shows it leads somewhere), one or two facts and one badge. A restricted collection shows Thumbnail's `restricted` placeholder and fetches nothing. Lay them out with `grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]`.",
    ],
  },
  avatar: {
    group: "Data display",
    examples: { file: "display", prefix: "Avatar" },
    rules: [
      "A person or a robot, by picture or initials. Initials when there is no picture, never an empty circle.",
      "People are round; robots, sites and teams are square (shape=\"square\"), so a mixed list tells who from what before the name is read.",
      'A robot without a picture shows its short ID (the last four characters, `className="font-mono"` on the fallback) or its initials, never a hand-made tile. Square corners follow IconTile at the same size (8 px at 32, 12 px at 40 and 48), so a robot beside an icon lines up.',
      "Pair it with the name: an avatar alone is not an identity. A status mark (AvatarBadge `status`) is said in words too, nearby or in the label.",
      "A group shows a few and folds the rest into +N (max); its label names everyone.",
    ],
  },
  separator: {
    group: "Layout",
    examples: { file: "display", prefix: "Separator" },
    rules: [
      "Splits groups the eye would otherwise run together. If spacing already separates them, leave it out.",
      "Decorative by default; mark it as a separator only between groups of a menu or toolbar.",
    ],
  },
  progress: {
    group: "Feedback",
    examples: { file: "display", prefix: "Progress" },
    rules: [
      "Blue: a process someone is waiting on, with an end. A level that stays (battery, storage, signal) is a Meter, not a Progress.",
      "A finished bar is `tone=\"neutral\"`, grey; there is no success tone (removed in 0.40). Green is a confirmation that comes and goes (a toast), not a state.",
    ],
  },
  spinner: {
    group: "Feedback",
    examples: { file: "display", prefix: "Spinner" },
    rules: [
      "Waits 300 ms before it appears. Work that finishes sooner never flashes a spinner.",
      "Prefer Skeleton when you know the shape of what is loading.",
      "In the text's colour, muted beside a label, never blue: waiting is not a process the person can follow. Blue belongs to Progress and to a running state's shape (a Trace step, a route being driven).",
    ],
  },
  meter: {
    group: "Status & values",
    examples: { file: "display", prefix: "Meter" },
    rules: [
      "For a level in a known range (battery, storage). For work under way, use Progress.",
      "Neutral while normal; warning past `low`, danger past `critical`; the value is always written. Past a threshold the status glyph (triangle, square) stands before the value and the word (Low, Critical) beside it: only the glyph and the word take the colour, the number stays text. `inline` keeps the glyph; its word is read with the value. A battery takes only `low` (15 %): a low battery needs attention, it is not a failure, so it turns warning and never danger. Danger is for a level that breaks something, like full storage.",
      "`inline` in table cells; the label is still read by screen readers.",
      "With `higherIsWorse` (temperature, storage) the warning is read as high, not low. `showMax` writes the total for an amount whose total matters: 412 of 512 GB.",
      "`showThresholds` draws a grey tick at `low` and `critical` where how close the limit is matters, as on a quota. The tick stays grey: colour still means crossed.",
      "Pass `locale` for big counts (412,345 of 1,000,000 items), and `format` to shorten them (`{ notation: \"compact\" }`: 412K of 1M).",
    ],
  },
  "metric-card": {
    group: "Status & values",
    /** A row of cards needs the row: examples use the card's full width. */
    wide: true,
    examples: { file: "metric-card", prefix: "MetricCard" },
    rules: [
      "Only a change for the worse is coloured (`trend=\"bad\"`, danger text). Good news stays foreground and no change stays grey, so the bad number is the one people see. The trend says whether the change is good, not which way it went.",
      "A number that is itself a warning (items waiting for review, a quota near its limit) takes `tone=\"warning\"` (or `\"danger\"`): the caption gets the status shape and colour and says why. The value stays foreground; never a tinted card.",
      "The sparkline is neutral and silent; the delta and the caption say in words what it shows. From 640 px it sits beside the value; on a phone it takes its own full-width line under it, and the change sits under the label so the values line up.",
      "A value that cannot be read is `unavailable` with the reason; never a 0 or an empty card.",
      "`loading` keeps the label and the card's height; only the value, change and caption are bones.",
      "`href` makes the whole card one link (pass `linkAs` for your router); give it only when a page sits behind the number.",
      "Put the cards in a MetricGrid: two across from the smallest phone, four from 1280 px. One row under the page header, what needs someone (alarms) above it.",
      "A level in a known range (battery, storage, signal) is a Meter, not a metric card.",
    ],
  },
  "description-list": {
    group: "Lists & tables",
    examples: { file: "display", prefix: "DescriptionList" },
    rules: ["Label above value, value in medium weight with tabular numbers.", "`tiles` only for the few numbers that matter most; everything else plain.", "`bare` inside something that is already a surface (a card, an expanded table row), so cards never nest."],
  },
  "empty-state": {
    group: "Feedback",
    examples: { file: "display", prefix: "EmptyState" },
    rules: [
      "Says what is missing, why, and the next step as a button. Never a bare “No data”.",
      "When a filter or search caused it, the action clears it.",
      'Every empty place uses it, at the size of its host: `panel` (default) for a card, a page section or a dialog body; `size="inline"` in a table, a list, a toolbar region or a small panel (a bare icon, 14 px words); `variant="overlay"` over a canvas or a picture (a map, a point cloud, a 3D model, a camera), placed by the viewport\'s overlay layer. Never a hand-made icon and paragraph, a bare grey line or a boxed note.',
      "The panel's icon sits on IconTile; inline and overlay icons are bare. Never a tile of its own.",
    ],
  },
  table: {
    group: "Lists & tables",
    examples: { file: "display", prefix: "Table" },
    rules: [
      "Right-align numbers. Numbers are tabular by default.",
      "`bare` inside something that is already a surface (a card, a sheet, a step's panel): no edge of its own, only the hairlines between rows, so edges never nest.",
      "A row's actions sit in its last cell, TableActionsCell: a ⋯ menu (DropdownMenuMoreTrigger with the row's name) or one or two icon buttons. Its header cell takes the same padding (`w-0 pr-2 pl-0 sm:px-4`) and a visually hidden “Actions”.",
      'No rows: one row whose cell spans every column and holds an inline EmptyState (`size="inline"`), never a bare line of grey text.',
      "Rows that phones see too: `responsive-table`, which renders this table and a grouped list from one list of columns, never a second phone list written by hand.",
    ],
  },
  "responsive-table": {
    group: "Lists & tables",
    /** The table needs the row's width to show its wide layout. */
    wide: true,
    examples: { file: "responsive-table", prefix: "ResponsiveTable" },
    rules: [
      "Rows that people open on phones as well as on desks: one list of columns renders a Table where there are 36rem (576 px) of its own width, and a grouped list (ListGroup, ListRow) under that. Its own width decides, so a narrow column on a wide screen gets the list too.",
      "Only one layout is in the page at a time, so a screen reader never meets the rows twice: table semantics on wide screens, a list of list items on phones. Before it is measured (the server's HTML) a container query shows the right one.",
      "Each column says where it goes on a phone: the first is the row's title, `trailing` is the state at the row's end (InlineStatus, one column), the rest form the line under the title (`meta`, one or two facts) or are `hidden`. `phoneCell` gives a shorter form (\"82 %\" for a meter). The phone row's title wraps to two lines rather than being cut, and the trailing state moves under it before it squeezes the title below 160 px.",
      "`onRowClick` makes the title cell a button in the table and the whole phone row a 56 px button with a chevron. `rowActions` is the ⋯ menu: TableActionsCell in the table, after the row's button on a phone.",
      "Numbers `align: \"end\"`, written in full (formatCount). No rows: `empty` with an inline EmptyState.",
      "Many columns to scan, sort and select on a desk: DataGrid. A list that is only ever on phones: ListGroup and ListRow.",
    ],
  },
  list: {
    group: "Lists & tables",
    examples: { file: "list", only: ["GroupedList"] },
    rules: [
      "Rows of the same kind, each a whole touch target at 56 px, with its state in the trailing slot.",
      "Group long lists under headings; more than about 50 rows wants search or a DataGrid.",
      "A row whose title is the words that matter (an incident, an alarm) takes `wrap`: the title wraps to two lines instead of being cut, and the trailing slot moves under it before it squeezes the title below 160 px.",
    ],
  },
  "status-glyph": {
    group: "Status & values",
    examples: { file: "display", prefix: "StatusGlyph" },
    rules: [
      "Status is a shape and a word; colour only when it is abnormal. The shape reads without colour vision: filled circle active (busy), hollow circle normal, triangle attention, square stopped, slashed circle offline (grey).",
      "The glyph is hidden from screen readers: write the status in words beside it, or use `status-eyebrow`, which does.",
      "Pass `status`: active, normal, warning, danger or offline (the default). The old `tone` names (info, success, neutral) were removed in 0.40.",
    ],
  },
  "status-eyebrow": {
    group: "Status & values",
    examples: { file: "list", only: ["StatusShapes", "StatusEyebrowOverTitle", "StatusInlineInRows"] },
    rules: [
      "`InlineStatus` is the one way to write a state that changes (a robot's status, a job's state): its shape and its word, no box, in a row's trailing slot, a table cell, or beside a page title (PageHeader's `status`, at most one). Never a Badge or a MetaPill for a state.",
      "`StatusEyebrow` is the same state above a headline (a robot's page title: Patrolling, then Patrol dog 7F3A).",
      "Pass `status`: active, normal, warning, danger or offline. Only warning and danger are coloured; shape plus word, always both.",
      "`className` on InlineStatus sets its size where the line around it is smaller (`text-xs` in a 12 px meta line).",
    ],
  },
  skeleton: {
    group: "Feedback",
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
      "Never auto-dismissed, never a toast, never blinking, never a tinted row. Colour is only on the glyph and the priority word. Unacknowledged: bold title and a solid bar in the priority's colour, a pill in its own 24 px gutter, never against the card's edge; beside Acknowledge the state is not repeated in words (screen readers still hear it). Cleared but not acknowledged: still bold, the bar dashed, and it says when it cleared. Acknowledged: regular and grey, with when (“Acknowledged 13:42”, from `acknowledgedAt`).",
      "Time comes first, in tabular figures, so order and age read down the column. Below 576 px of width the row reflows: the time under the title, the state and buttons on a line of their own.",
      "“Acknowledge all” appears only when the app passes onAcknowledgeAll, with two or more alarms it may take in view, and takes only those: never a critical alarm (each is acknowledged on its own row; the button then reads “Acknowledge 3 non-critical”), never shelved, suppressed or out-of-service alarms, and in a flood the folded low ones only while their group is open (“Acknowledge 2 shown”). Screen readers hear how many were acknowledged. Leave it out where every alarm must be read on its own.",
      "One alarm per root cause. If the robot is offline, do not also raise camera lost and lidar lost.",
      "Shelving hides a nuisance alarm for a set time and it comes back on its own; it is never permanent and never for critical alarms. Suppressed by design (the app's logic) and out of service (maintenance) are counted under the list, not hidden silently.",
      "Pass `raisedAt` so a flood (over 10 alarms in 10 minutes) is named and the low ones fold away; then fix the root cause the flood points to.",
    ],
  },
  "share-bar": {
    group: "Charts",
    examples: { file: "data-pieces", prefix: "ShareBar" },
    rules: [
      "How a whole splits into a few parts (up to three, then “Other”): the first in the accent, then two greys, then the light grey for Other. For values over time or many categories, use a chart.",
      "Colours follow the order you give, never the size, and are never status colours.",
      "Outside a table cell, show the legend: identity never rests on colour alone. In a table, the column header names the parts.",
      "Give a segment `href` when its part is a view to follow (the list filtered to it): its legend entry becomes the link, named with its share (\"Fleet cameras 5,060, 51 %\"). The bar stays one picture, so each part has one target. Pass `linkAs` for your router.",
      "A list of bars (one per task, per class) has one ShareLegend above it, not a legend per row. Give it the same segments in the same order as the bars, so the colours match; each bar keeps its own name.",
    ],
  },
  "bar-list": {
    group: "Charts",
    examples: { file: "bar-list", prefix: "BarList" },
    rules: [
      "A short ranked list of counts: items per class, files per format, the top 5 to 10. Pass the rows in the order to show them, largest first; `max` shows that many, then says how many more.",
      "One series: every bar is `--chart-1`, scaled to the largest value. No status colours, no colour per row; a row that needs attention says so in words elsewhere.",
      "The value is written in each row (tabular, with `locale`; `format` to shorten it), so it needs no Chart / Table switch, as a sparkline does.",
      "No surface of its own: put it in a Card (with CardDataHeader naming it), a table cell or a sheet. `label` names the list for screen readers; show the same words as the card's title.",
      "Give a row `href` when it leads to a view of that item (the list filtered to it): the whole row is the link, 36 px tall (44 on touch). Pass `linkAs` for your router.",
      "A level against a known range (storage, a quota) is a Meter; values over time or a chart people explore is `chart` (bar-chart-ranked).",
    ],
  },
  "restricted-preview": {
    group: "Media & files",
    examples: { file: "data-pieces", prefix: "RestrictedPreview" },
    rules: [
      "For pictures someone should choose to see: restricted tiers, faces, number plates. Nothing loads until they ask.",
      "Neutral, not a warning colour: restricted is a property of the data, not a fault. Say why in `reason`.",
      "Each preview reveals on its own; log the reveal in `onReveal` if the data needs an audit trail.",
    ],
  },
  thumbnail: {
    group: "Media & files",
    examples: { file: "thumbnail", prefix: "Thumbnail" },
    rules: [
      "One small picture at the start of a table row, a list row or a card's row. Many pictures to browse or open: ImageGrid.",
      "Sizes come from the control scale: `sm` (--h-sm, 36 px, 44 on touch) in a table, `md` (--h-md, 44), `lg` (--h-lg, 48) in a list or a card. Never a size of your own.",
      "Give `alt` what the picture shows, or `alt=\"\"` when the row's own words already say it.",
      "A row the viewer may not see (faces, number plates, a restricted tier) is `restricted` with a `reason`: the neutral placeholder, named by the reason, with nothing fetched. Never a warning colour: restricted is a property of the data.",
      "The reason is a hover tooltip and the placeholder's accessible name; touch screens show no tooltip, so where the reason matters, say it in the row too (a TierBadge).",
      "It is not a control and never takes focus: make the row, or a link in it, the target.",
    ],
  },
  "image-grid": {
    wide: true,
    group: "Media & files",
    examples: { file: "image-grid", prefix: "ImageGrid" },
    rules: [
      "Every tile keeps its aspect box before and after the picture loads, so the grid never jumps; pictures load lazily.",
      "Give each picture an alt that says what it shows, and its file name: the name is what a broken tile and the lightbox title show.",
      "Picked tiles are ringed in the focus ink with a check, never a status colour. While picking, the corner button opens the lightbox.",
      "Pictures the viewer must ask to see are `restricted`, with a `reason`; nothing loads before they ask. Log the view in `onReveal`.",
      "Use the strip for a short row, such as what was just uploaded; for a whole dataset, the grid.",
      "When the page has its own detail view (a Sheet with the picture's labels and file), pass `onOpen(item, index)`: it replaces the lightbox, and the keys, hidden and broken tiles stay the same. Open a dialog from it, and give it back focus when it closes: call `restoreFocus()` on the grid's `ref` in the dialog's `onCloseAutoFocus`, after `preventDefault()`.",
      "`renderTile(item, { onError })` draws the picture area of a tile your way, such as an AnnotatedImage with the boxes on it (no legend, no words on a small tile). The grid keeps the button, its name (the item's `alt`), the shape, picking and the hidden tile; call `onError` when your picture fails and the tile shows the grid's failed state. No controls inside a face: the tile is the button.",
    ],
  },
  "annotated-image": {
    wide: true,
    group: "Media & files",
    examples: { file: "annotated-image", prefix: "AnnotatedImage" },
    rules: [
      "Coordinates are the picture's own pixels; give its natural `width` and `height`. The box keeps that aspect ratio, so the marks line up at any size.",
      "Line style says where a mark came from (predicted solid, ground truth dashed, previous dotted); the class is the word on it. Never a colour per class, never status colours.",
      "Keep the legend (or an AnnotationLegend nearby) whenever more than one kind is on screen.",
      "Crowded picture, or a picture shown phone-wide: `showLabels=\"selected\"`. The words are still read out in the summary or on each annotation's button.",
      "Selectable only when something happens on select (a details panel, a review); otherwise the picture is one image with a summary.",
      "To point at marks from outside the picture (a hovered word, a table row), pass their ids as `highlighted`: they draw in the selected ink and the rest fade. `onActiveChange` says which mark the pointer or keyboard is on.",
      "The picture from `src` loads lazily. When it fails, the kit's failed state shows and `onLoadError` tells the app, to count failures or offer a retry; keep `src` rather than passing your own `image` for that.",
      "Three kinds only. A mark derived from another (a region inferred from a box) keeps its source's kind and says so in `description`.",
    ],
  },
  "grounded-text": {
    wide: true,
    group: "Media & files",
    examples: { file: "grounded-text", prefix: "GroundedText" },
    rules: [
      "For text that names places on a picture: a model's caption or reasoning, a review note. A picture with marks and no text is `annotated-image`.",
      "Pass the model's offsets as they come (`start`, `end`, or `fromGrounding` for `start_idx`, `end_idx` and points or boxes in pixels, 0–1, percent or 0–1000). Spans must not overlap; a span that does starts where the one before ends.",
      "Give every span the ids of all its marks, and every mark a span. A span whose marks are not on the picture is plain text.",
      "Highlighting is the selected ink at 3 px with the rest faded, never a colour per span. In high contrast nothing fades; the width carries it.",
      "Class words on the picture are off: the text names each mark. Turn on `showLabels=\"selected\"` when the words differ from the text (a model's class next to a person's note).",
      "The text is beside the picture from 42 rem of the component's own width (a 720 px canvas), under it when narrower. It follows its container, not the window: put it in the panel, not a wider wrapper.",
      "When the screen already shows the picture in its own panel, use `GroundedTextBody` in the other and wire the one annotated-image with `groundedImageProps`: one picture on the page, never a second copy. Share `pinned`; the picture's `onActiveChange` goes to `activeMark`, the text's `onActiveChange` to `activeSpan`.",
      "Pass the picture's panel as `picture`: pinning a span scrolls its marks into view there. Hovering never scrolls; reduced motion jumps.",
    ],
  },
  "media-player": {
    wide: true,
    group: "Media & files",
    examples: { file: "media-player", prefix: "MediaPlayer" },
    rules: [
      "For a recorded clip with an end. A live camera is `camera-feed`: no timeline, no speed, a latency and a connection state instead.",
      "Give `label` the clip's who, where and when (\"Patrol dog 7F3A, front camera, 14:02\"); it names the player for screen readers.",
      "Pass `duration` from the clip's record, so the time and the markers show before the file loads; `preload=\"none\"` in a long list of clips.",
      "Markers are events in the clip (Obstacle, Stop pressed), a word each, at most a handful. They are listed under the player too, for the keyboard and screen readers. A marker is a 24 px target with a mouse and 44 px on touch (48 in gloves); it looks the same.",
      "A marker with `end` is a window (Person in path, 12:04–12:31): a bracket from start to end above the track, never a fill on it, so it is not read as the played part. It is named by its range, and a press goes to its start.",
      "Several clips side by side: `markerList=\"collapsed\"`, so each is the picture and one \"3 events\" row and the grid lines up. `markerList=\"none\"` only when the page lists the events itself; the marks on the timeline then take the keyboard and are named.",
      "Never autoplay with sound. `autoPlay` starts muted and does nothing for someone who asked for reduced motion.",
      "When the clip cannot play, say why after \"Clip unavailable:\" (not uploaded yet, expired, the robot was offline) and offer a retry only when retrying can help.",
    ],
  },
  "camera-feed": {
    wide: true,
    group: "Robotics",
    examples: { file: "camera-feed", prefix: "CameraFeed" },
    rules: [
      "For a live camera. A recording with an end is `media-player`.",
      "The app owns the connection (WebRTC, a gateway, a live URL); pass the `stream` or `src` and say what the connection is doing in `status`. The feed tells Live from Stalled by itself, from the frames.",
      "Give `label` the camera and `source` the robot (\"Front camera\", \"Patrol dog 7F3A\"): the header writes both, and they name the feed for screen readers.",
      "Pass `latencyMs` whenever you measure it: an operator driving from the picture needs to know how old it is.",
      "Never hide a frozen picture: keep `staleAfterMs` at its 2 s default, shorter for teleoperation, longer only for a camera that sends a frame every few seconds. `null` never stalls: only for a picture that is not live.",
      "Overlays (`children`) are drawn in the video box's own coordinates; they hide while there is no picture, so a box never floats over a skeleton.",
      "Offer Reconnect (`onRetry`) only when reconnecting can help, and say why it is offline in `offlineReason` when you know.",
    ],
  },
  "camera-wall": {
    wide: true,
    group: "Robotics",
    examples: { file: "camera-wall", prefix: "CameraWall" },
    rules: [
      "For watching several robots' cameras at once (4 to 16 on a screen). One camera on a robot's page is `camera-feed`.",
      "`getSource(camera, { quality })` is the product's: return the same stream (or URL) for the same camera and quality, from a cache, and open connections lazily. Close what `onLiveChange` no longer lists. For ROS image topics, `webVideoServerSrc` from `ros` builds the URL.",
      "Only the focused camera asks for \"high\"; tiles ask for \"low\". Serve a smaller stream for low (640×360 or less): sixteen full-size streams decode slower than any screen can show them.",
      "Set `maxLive` to what the operator's machine and the site's uplink can carry (9 by default); the rest show their last still with \"Paused to save bandwidth\", and focusing one plays it. Give each camera a `poster` (a snapshot URL) so a paused tile is never blank.",
      "Pass the robot's most urgent active alarm as `alarm` (priority and title): it sorts the tile first and marks it by shape and word. The alarm list announces alarms; the wall announces only cameras that stall, go offline or come back.",
      "Keep the default sort, attention first, on a wall people watch for problems; by name suits a wall people search.",
      "Give every camera a stable `id` and the same `label` and `source` as its robot's page, so the tile, the large view and the screen reader say the same name.",
    ],
  },
  "joint-state": {
    wide: true,
    group: "Robotics",
    examples: { file: "joint-state", prefix: "JointState" },
    rules: [
      "For watching an arm's joints. It has nothing to press: jogging a joint is a control, with its own confirmation and a hold-to-run button.",
      "Pass the values as ROS sends them (radians and metres) with each joint's `unit`; the panel shows degrees and millimetres. Never convert before passing them, or the limits and the position will disagree.",
      "Give every joint its URDF `lower` and `upper`. Leave both out only for a continuous joint: it shows no track, and it can never be near a limit.",
      "Keep `margin` at 5 % of the range unless the arm's safety configuration sets its own soft limits; then pass that fraction, so the panel warns where the controller will.",
      "Pass `updatedAt` from the message's `header.stamp` when you have it: a robot that keeps publishing an old state still reads Stale. Keep `staleAfterMs` near three missed messages (the default 1 s suits a joint state at 10 Hz or faster); `null` only for values that are not live.",
      "List the joints in chain order (base to tool), as the URDF does, not alphabetically.",
    ],
  },
  diagnostics: {
    wide: true,
    group: "Robotics",
    examples: { file: "diagnostics", prefix: "Diagnostics" },
    rules: [
      "For finding what is wrong with a robot's hardware and software, not for raising it: a fault that needs someone now is an alarm too. This panel says where and why; the alarm asks for the action.",
      "Feed it /diagnostics_agg when the robot runs the aggregator: its \"/\" names give the tree. Raw /diagnostics works too, as a flat list.",
      "Keep every name's latest status (`mergeDiagnostics`) and stamp each with `receivedAt` when it arrives, never the header stamp. Keep `staleAfterMs` at the aggregator's timeout (the default 5 s) unless a node publishes slower; `null` only for a record that is not live.",
      "Colour only on the glyph and the word, and only for Warning and Error. Rows are never tinted, so a tree with several problems still reads as a list.",
      "Do not sort the tree by level: rows that move as levels change are hard to read and to tap. The summary puts the worst first; Problems narrows the tree to it.",
      "Put it on the robot's own page or a sheet from the fleet table, full width; on a phone it keeps the name and the word and opens a row for the message and values.",
    ],
  },
  alert: {
    group: "Feedback",
    examples: { file: "display", prefix: "Alert" },
    rules: [
      "A condition on this page that stays while it is true (a licence about to expire, a form that cannot be sent). No acknowledge.",
      "If the operator must act on the robot, it is an alarm instead.",
      "Tone by consequence, as a banner: neutral for calm conditions, info only while a process runs (never for a state), warning before something is lost, danger when the page cannot work. No success tone: a success does not stay, so it is a toast.",
    ],
  },
  banner: {
    group: "Feedback",
    examples: { file: "banner", prefix: "Banner" },
    // A banner spans the page, so its examples do too, also once it is dismissed.
    wide: true,
    rules: [
      "About the app, not one record: maintenance, read-only mode, a trial ending, no connection. A condition of one page or form is an Alert in the content; the result of what someone just did is a Toast.",
      "Full width, first in the page (or above the whole app), before the header in the DOM so it is read first. At most one at a time: show the most severe and let the next one wait.",
      "Tone by consequence: neutral for calm conditions, info only while a process runs (syncing back, a maintenance window under way), warning before something is lost, danger when the app cannot work. Danger is a tint, never solid red. Give it an icon that names the subject (Wrench, Lock, CloudOff).",
      "role=\"status\" for neutral, info and warning (read politely); role=\"alert\" only for danger. It is not role=\"banner\", which is the page header landmark.",
      "One action at most, named by its result (\"Choose a plan\", \"Try again\"): a Button, size md, outline.",
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
      "At most three on screen, stacked with the newest in front; more wait behind and come forward as those in front go. Hovering, focusing or touching the stack spreads it out. Never use a toast for an alarm.",
    ],
  },
  // Navigation
  breadcrumb: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Breadcrumb" },
    rules: [
      "Each level is a link; the current page is last and is not.",
      "In an app shell, pass it as `breadcrumb`: the top bar's title is the current page.",
      "It needs no set width: stretched or as wide as its content, every level shows in full while the row has room. Short of room, the first level keeps its name or a third of the row, whichever is less, and the current page takes what is left.",
    ],
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
      "Over long sections, `sticky` on TabsList keeps the row in view under the shell's top bar. One sticky row per page; picking a tab while it is stuck goes back to the start of the tabs.",
      "A row of links to other pages is navigation, not tabs: use ChipGroup with `href`, or NavigationMenu.",
    ],
  },
  accordion: {
    group: "Navigation",
    examples: { file: "navigation", prefix: "Accordion" },
    rules: [
      "Long content most people skip: FAQs, advanced settings. Content everyone needs stays open.",
      "One open at a time only when the sections are alternatives.",
      "Each trigger sits in an h3. Set `as` on AccordionTrigger to the level the page needs: h2 right under the h1, h4 inside a section under an h3.",
    ],
  },
  collapsible: {
    group: "Navigation",
    examples: { file: "collapsible", prefix: "Collapsible" },
    rules: [
      "One trigger that opens one region: \"More filters\", \"How to use this\", the rest of a long note. For a set of sections with headings use Accordion.",
      "The trigger says what it opens, in a word or two; the chevron says it opens. It needs no heading: it is not a section.",
      "Closed by default. Content most people need stays out of it.",
      "Content open from the start (`defaultOpen`) shows at once; it animates only when someone opens or closes it.",
    ],
  },
  tree: {
    group: "Lists & tables",
    examples: { file: "tree", prefix: "Tree" },
    rules: [
      "list (default) for a hierarchy people read and follow links in: lineage, an outline. select only when choosing a node is the job (a file explorer, a site picker): it is one Tab stop with arrow keys, and its nodes are not links.",
      "A node used twice (a source under two label sets) is named again with a marker in meta, \"(listed above)\", not drawn twice in full. When many nodes have several parents, it is a Graph.",
      "meta is a count, a size or a calm state word, in muted text; never a coloured status. A disabled node says why in its meta.",
      "Open what people came for (defaultExpanded or expandAll for short trees); a deep tree starts collapsed.",
      "Give textValue when label is not a string, so type-ahead and screen readers have its name.",
      "content (list mode) is a node's own details under it, opened by its disclosure button: a short key/value table, a log line. Not a second tree, and not a form.",
    ],
  },
  sidebar: {
    group: "Navigation",
    /** A console frame: the sidebar beside a page needs the card's full width. */
    wide: true,
    examples: { file: "sidebar", prefix: "Sidebar" },
    rules: [
      "For an app's sections: the main navigation of a console. Pages of one section go under it (SidebarMenuSub), shown while the section is current; never more than two levels.",
      "Current page: isActive, the kit's muted fill and weight. Hover is the lighter accent. Never a colour, never a bar beside the item.",
      "Counts are SidebarMenuBadge: danger only for what needs someone (unacknowledged alarms), neutral for the rest. Tags (\"Beta\", \"New\") are SidebarMenuTag, small grey words.",
      "Every item leads with an icon and has a tooltip: collapsed, the rail shows only the icons. Group names give way to a short line.",
      "A switcher for sites, workspaces or robots goes in SidebarHeader as a size=\"lg\" button that opens a menu; the account goes in SidebarFooter the same way.",
      "Open by default on wide screens, a rail below about 1280 px. People choose with the trigger or ⌘B / Ctrl+B, and the cookie keeps it.",
      "Collapse and width belong to the sidebar's edge: SidebarRail is a handle beside it (a window splitter), hidden until the pointer is over the sidebar. Drag it to resize (200 to 320 px, under 140 it folds to the rail), click it or press Enter to collapse and expand, ← and → to resize from the keyboard. Beside a floating sidebar it sits in the gap, over nothing; never a control in the top bar on wide screens. On phones the sidebar is a sheet: SidebarTrigger show=\"mobile\" in the top bar is its menu button.",
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
      "Bottom on phones, right on wide screens, left for navigation: `side=\"end\"` does the first two in one (bottom under 640 px, right from 640 px), for a detail or a form beside the page. Esc and the scrim close it.",
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
      "The switch is `ChartViewSwitch` (from segmented-control) in CardDataHeader's `actions`, at `--h-sm`; another control beside it in the header (a range) is `--h-sm` too.",
      "One y axis. Two measures on different scales are two charts.",
      "Lines 2 px; bars with 4 px rounded data ends and a 2 px gap in the card colour between bars and segments; a horizontal hairline grid; no axis lines.",
      "The chart fades in when it mounts (--motion-base); marks do not animate, because Recharts cannot use the motion tokens. Nothing moves under reduced motion.",
    ],
  },
  "streaming-chart": {
    group: "Charts",
    wide: true,
    examples: { file: "streaming-chart", prefix: "StreamingChart" },
    rules: [
      "For values arriving many times a second that someone watches as they happen: motor currents, speed, a temperature, a battery's voltage. A history read afterwards (a shift, a week) is `chart`; one value now is a `metric-card` or a `meter`.",
      "Push readings, never pass them as props: `ref.current.push({ left: 12.4 })`, or a `subscribe` function that gets `push` once and returns its cleanup. The chart keeps them in its own ring buffers and draws on the next frame; a reading never renders React.",
      "Stamp each reading with the message's time (`header.stamp` through `stampToMs`) when it has one: the time axis follows the readings' own clock, so a robot whose clock is off by seconds still draws at the right edge.",
      "One unit per chart, as every chart has one y axis: three motor currents together, but speed, temperature and voltage as three charts (small multiples), driven by one set of controls through `window` and `paused` with `controls={false}` on the others.",
      "The palette and line styles are `chart`'s: the series to watch is slot 1, solid; the next two graphite, dashed then dotted; three series and Other at most. Never a status colour for a series.",
      "Fix `domain` for a value with known bounds (a current's range, a pack's voltage), so the lines do not jump as the range follows the data. Without it the range rounds to steps around what is in view and the limits.",
      "A limit is a dashed line with its label at the end; only the legend says a series is past it, in words beside a warning triangle, and screen readers hear it once as it crosses. `over: \"below\"` for a floor (a battery voltage).",
      "Keep `staleAfterMs` near three missed readings at the stream's rate (the default 2 s suits 2 Hz and faster); `null` only for a chart of data that is not live. Silence breaks the line and says No new data with the last reading's time, instead of drawing a flat line across it.",
      "Pause freezes the view only: readings keep arriving into the buffer, which holds `capacity` readings per series (10 minutes at 60 Hz by default). Raise it for a longer window at a high rate.",
      "Under reduced motion the view steps once a second instead of gliding. Off screen and in a hidden tab nothing is drawn.",
    ],
  },
  attitude: {
    group: "Robotics",
    examples: { file: "attitude", prefix: "Attitude" },
    rules: [
      "AttitudeIndicator for a robot that can tip or slide: a legged robot on rough ground, an AMR on a ramp, a tracked robot on a slope. Gauge for one value now with a known range that someone glances at (speed, a motor's temperature, a wheel's current); a level that stays (battery, storage) is a `meter`, a history is `streaming-chart`.",
      "Angles in degrees with REP 103's signs: positive roll is the right side down, positive pitch the nose down. `imuToAttitude(msg)` from `ros` gives them from a sensor_msgs/Imu; never flip pitch to nose-up-positive in the app, the words (\"nose up\", \"nose down\") already say it.",
      "Set `limits` from the robot's datasheet: a tip-over warning (`roll.warning`, 25° on the patrol dog) and the angle it must not pass (`critical`). They are marked with the kit's status shapes (triangle, square) and stay grey until crossed; past one the value, the mark and the robot's symbol turn warning or danger and a word says so. Colour never alone.",
      "Gauge takes Meter's thresholds as they are: `low` warns, `critical` is danger, `higherIsWorse` for a value that heats up or fills up. The arc stays graphite while normal, like Meter's bar; the indigo accent is only the horizon line, the mark to read.",
      "Push a stream, never pass it as props: `ref.current.push({ roll, pitch, heading }, stamp)` or a `subscribe` that gets `push` once. The drawing follows every frame; the numbers are written four times a second, so they can be read, and at once when a limit is crossed.",
      "Stale is on by default (1 s for the attitude, 3 s for a gauge): a frozen instrument dims and says Stale with the last update's time instead of passing for live. Pass the message's stamp as `updatedAt`; set `staleAfterMs` to about three missed messages for a slower topic (a battery at 0.2 Hz: 15 s), and `null` only for a value that is not live.",
      "Heading only from an IMU fused with a magnetometer (or a localisation in a map frame): an IMU alone drifts in yaw. Pass `{ heading: false }` to `imuToAttitude` and the ring shows no compass.",
      "Not a control: nothing in either instrument takes focus. Screen readers hear the attitude as one sentence (\"Roll 12° left, pitch 3° nose down, heading 271° W\") and each Gauge as a meter; a crossed limit is said politely, at most every 5 s, at once when it turns critical.",
      "No sweep: values move straight to where they are, and under reduced motion the drawing steps with the numbers instead of following every frame.",
    ],
  },
  "robot-map": {
    group: "Robotics",
    wide: true,
    examples: { file: "robot-map", prefix: "RobotMap" },
    rules: [
      "Offer RobotMapList beside every RobotMap, as a chart offers its table: a Map / List switch, the two side by side on a wide screen, or a Robots sheet over a full-screen map. The map is one Tab stop; the list is where each robot is reached by keyboard and screen reader. `lint:rules` asks for it in a block.",
      "Each layer keeps one job (Data visualisation, Maps and robot tracks): the floor and grid grey, zones as hairline outlines with an icon and a name and never a fill, the route being driven dashed blue (the one blue on the map), the track travelled solid grey.",
      "Robots are their status shape and name, as in every list; colour and the status word only for a robot that needs someone. Selection is a ring in the focus ring's ink and a bold name, never colour alone.",
      "Coordinates are metres from the plan's top-left corner, x to the right and y down, as the plan image is drawn. Convert from your map frame (ROS: y up, origin anywhere) before passing them.",
      "Bottom left holds zoom and the scale bar, so the emergency stop keeps the bottom right. Show the north arrow (`northDeg`) only when the plan is not drawn north up and people need it.",
      "No robots is said on the map, with the plan still shown; loading keeps the frame's size; an error says what failed and offers to reload.",
      "An occupancy grid is the floor, in greys: free is the surface, occupied the ink, unknown the no-data hatch, never a colour that means a state. A costmap is the accent's ramp under the walls, with its legend in words.",
      "Laser scans are small dots in a neutral ink (the accent over a grid), never a status colour; they show what a robot sees, so a scan beside the walls says its localisation has drifted.",
      "Editing (`mode`) is controlled: the app keeps the goal, waypoints and zones and the map reports changes. One rule for panning while editing: the primary pointer edits, the right or middle button and two fingers pan. Every edit has its keys (a crosshair, Enter, Esc, Delete) and is said in words.",
      "A route still being drawn is grey; only the route a robot is driving is blue (`waypointsPlanned`).",
      "Up to a few hundred robots and zones: everything is redrawn on each pan. Robots outdoors on GPS, over tiles, are `geo-map`; a city-scale map belongs to a map library.",
    ],
  },
  "geo-map": {
    group: "Robotics",
    wide: true,
    examples: { file: "geo-map", prefix: "GeoMap" },
    rules: [
      "For robots that work outside on satellite positioning (patrol, agriculture, delivery), in latitude and longitude. A site's floor plan in metres, indoors, is `robot-map`.",
      "Offer GeoMapList beside every GeoMap, as a chart offers its table: a Map / List switch, or the two side by side on a wide screen. The map is one Tab stop; the list is where each robot and its coordinates are reached by keyboard and screen reader.",
      "Bring your own tile server: pass its `{z}/{x}/{y}` template as `tileUrl` and its licence's words as `attribution`. OpenStreetMap's public tile servers forbid heavy use and apps that do not identify themselves; never ship them as a default. Choose a dark style for the dark theme.",
      "Without `tileUrl` the map draws a coordinate grid in degrees and needs no network, for robots and control rooms that are offline or air-gapped. If every tile fails, it falls back to the grid and says so.",
      "Robots are their status shape and name, as on robot-map; colour and the status word only for a robot that needs someone. Each robot's fix is words (RTK fixed, GPS fix · ±3 m, No fix), and its accuracy a grey circle once it is larger than the marker. No fix is the one fix in the warning colour, with LocateOff in the list and a dashed marker at its last place.",
      "Geofences are outlines, never a fill: the work area dashed grey, a keep-out solid ink and hatched, never red. The route being driven is dashed blue (`routeActive`), the one blue on the map; a route not yet sent and the trails are grey.",
      "Goal mode asks before it sends: a click places the goal (a drag points it), and a card shows its coordinates, Send and Cancel. A goal in a keep-out or outside the work area cannot be sent: Send is disabled with the reason beside it (Inside Pond, a keep-out area), Enter does nothing but say it, and placing the goal somewhere allowed turns Send back on. Enter places and sends from the keyboard. `confirmGoal={false}` sends on release, as robot-map does, except where it cannot be sent: there it shows and says the same reason.",
      "Bottom left holds zoom, the scale bar (m or km at the view's latitude) and the attribution, so the emergency stop keeps the bottom right. The map is north up: no north arrow.",
      "Up to a few hundred robots, fences and route points; everything is redrawn on each pan. Vector tiles, a site that crosses the antimeridian, or a globe belong to a map library.",
    ],
  },
  "waypoint-editor": {
    group: "Robotics",
    wide: true,
    examples: { file: "waypoint-editor", prefix: "WaypointEditor" },
    rules: [
      "For planning a route before it is sent. A route being driven is `robot-map` `paths` (dashed blue); the editor's route is grey, as a route still being drawn.",
      "Keep the saved route in `value` and save in `onSave`; never write the draft back into `value` on every change, or Cancel and the unsaved state have nothing to compare with.",
      "Pass the map's `zones`: `restricted` zones are keep-out, and a waypoint inside one cannot be saved. Check again on the server with `validateWaypoints`.",
      "Problems are the warning shape and words on the row, the warning shape on the point, never a tinted row; Save stays visible, disabled, with the reason beside it.",
      "Delete and Cancel offer Undo in a toast: mount a `Toaster` once in the app.",
      "Give `speed` the robot's cruise speed on this site, so the estimate means something; say what `dwell` covers (docking, a photo) in your own help text.",
      "Viewers get `readOnly`: the same list, map and details, without handles, Add, Save or Cancel.",
      "Send it with `waypointsToNavigateThroughPoses` (or `waypointsToPath`) from `ros`; run each waypoint's action in the app or the robot's mission layer.",
    ],
  },
  "point-cloud": {
    group: "Robotics",
    wide: true,
    examples: { file: "point-cloud", prefix: "PointCloud" },
    rules: [
      "For what a LiDAR or depth camera sees, in 3D. A site's floor plan with robots on it is `robot-map`; a mesh or a CAD model is a different item.",
      "Pass the points in the ROS frame they came in (REP 103: x forward, y left, z up, metres), as a `Float32Array` of x, y, z. Decode the PointCloud2 in the app; NaN points are skipped.",
      "Colour by height unless intensity answers the question (reflective tape, glass, a retro-reflector). Colour is the accent's single-hue ramp with its scale in the footer, never a rainbow; `colorBy=\"none\"` draws the grey of a map's scans.",
      "For a live cloud, fix `colorRange` so a colour means the same height from one scan to the next, and pass `receivedAt` from the message's stamp: a cloud not replaced within `staleAfterMs` (3 s by default) says Stale instead of passing for live. A cloud that is not live (a saved map, a scan from a file) takes `staleAfterMs={null}`.",
      "Give `label` the sensor and the robot (\"Front lidar, Patrol dog 7F3A\"); screen readers hear it as the view's name, with the point count and the extent in metres as its description.",
      "Keep `pointSize` at 2 px for dense clouds; 3–4 px for sparse ones. Up to about 500,000 points stay smooth to turn: thin larger clouds before passing them (a voxel grid in the app).",
      "Bottom left holds Reset view and Fit, so the emergency stop keeps the bottom right.",
    ],
  },
  "robot-model": {
    group: "Robotics",
    wide: true,
    examples: { file: "robot-model", prefix: "RobotModel" },
    rules: [
      "For watching a robot's pose: an arm at work, a joint near its limit, the pose a fault stopped it in. It shows the robot and never moves it; jogging and teleoperation are other controls.",
      "Pass `joints` as ROS sends them (radians, metres for prismatic joints); `jointStateToRecord` turns a `sensor_msgs/JointState` into the record. A value past a limit is drawn where it is, not clamped: the view shows what the robot reports.",
      "Highlight only what needs someone (a joint near its limit, a link in fault), a handful at most. The link is drawn in the warning colour (`highlightStatus=\"danger\"` for a fault) and a callout names the joint with its value and limits, so it never rests on colour alone.",
      "Joints from a live topic go stale after `staleAfterMs` (1 s by default, for /joint_states at 10 Hz or more; `null` only for a pose that is not live); pass `updatedAt` from the message's stamp: the last pose stays, dimmed, with when it arrived. Without `updatedAt` only a change of value counts as an update, so a robot holding still goes stale.",
      "Serve meshes from your own origin: `packages` maps each `package://` name to a URL, `meshBaseUrl` is the folder for the rest. STL and COLLADA load; a file that fails is named in the error.",
      "One view per screen. Each view holds a WebGL context and browsers allow only a few; for a fleet, list the robots and open one view for the robot chosen.",
      "Load it lazily (`next/dynamic` or `React.lazy`): three.js is large, and only the screens that show a robot model should download it.",
    ],
  },
  "viewport-overlay": {
    group: "Robotics",
    wide: true,
    examples: { file: "viewport-overlay", prefix: "ViewportOverlay" },
    rules: [
      "Everything drawn over a map, a point cloud, a 3D view or a camera goes in a `ViewportOverlay`: 16 px from the frame's edges, pieces 8 px apart. Never a corner of your own (`top-3 left-3`).",
      "Each piece is a `ViewportPanel`: Float (`bg-float shadow-float ring-1 ring-edge backdrop-blur-xl`, opaque in high contrast) over a map or a canvas, `variant=\"scrim\"` for words straight over a picture. Never `bg-background`, which is the page, and never a card's ring with a shadow.",
      "One radius, the buttons' (`rounded-sm`): a zoom group over the view takes `rounded-sm shadow-float`, so its shadow follows its corners.",
      "Bottom left for the view's controls (zoom, fit, reset); keep the bottom right clear for the emergency stop. Top for what the view says about itself (a mode, a legend, Stale); top right for a compass or axes.",
      "The overlay lets the pointer through to the canvas; give what is pressed inside it `pointer-events-auto`. A message over the whole view is `position=\"center\"` on `bg-scrim` when the view behind it is not to be trusted.",
      "Status in a panel is the glyph and the word in the status colour; the panel and the other words stay neutral.",
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
  "dropdown-menu": {
    group: "Overlays",
    examples: { file: "overlays", prefix: "DropdownMenu" },
    rules: [
      "Destructive items go last, after a separator.",
      "The ⋯ that opens more actions is always DropdownMenuMoreTrigger: a ghost icon button, in rows, toolbars and card headers alike. Never an outline ⋯, never a hand-made one.",
      "Its name says whose actions they are. In a row, pass the row's name: “More actions for Patrol dog 7F3A”. In a toolbar or a card header, no name: “More actions”. A menu of view settings (wrap lines, relative time) is another meaning: the same button, named “View options”.",
      'Size it by the row it sits in: `size="icon-sm"` (36, 44 on touch) in a table row or a toolbar with no field; the default 44 beside a field. In a table it goes in TableActionsCell.',
    ],
  },
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
  // Robotics: the stop first, then the shell around it
  "stop-button": {
    group: "Robotics",
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
    group: "Robotics",
    examples: { file: "slide-to-release", only: ["Stopped", "ReleaseStates"] },
    rules: [
      "Letting go past 85% releases; short of that the thumb springs back in 200 ms.",
      "Viewers can see it but cannot release.",
      "Keyboard and switch control: hold Enter or Space for 2 s; the thumb travels while the key is held. Letting go, moving focus away or the page going to the background cancels the hold, so a held key never releases on its own.",
      "If the robot does not release, set `failed`: the thumb goes back and the label says to slide again. Never leave it on Releasing….",
    ],
  },
  "teleop-pad": {
    group: "Robotics",
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
    group: "Robotics",
    examples: { file: "dock", only: ["Moving", "DockRobotStates", "DockActionStates"] },
    rules: [
      "Three tiers, top to bottom: state action, this page's primary action, navigation.",
      "Actions in the lower tiers are never solid white, so they do not compete with the stop.",
    ],
  },
  island: {
    group: "Robotics",
    examples: { file: "island" },
    rules: [
      "Name, device status and notifications each expand on their own, one at a time, each into its panel: IslandRobots (switch robot), IslandStatus (connection, battery, last report), IslandNotifications. A zone with nothing to open is not a control people learn to ignore: give every zone its panel.",
      "An open panel never hides an alarm or a failure: notices and IslandAlarm stay above it. Esc or a tap outside closes it, and focus goes back to its zone.",
      "Failure notices stay until handled. A persistent fault (stopped) changes the tray edge colour; offline stays neutral and is said in words and by its shape.",
      "IslandAlarm shows the most urgent unacknowledged alarm above any notice, from the same data as AlarmList. The edge follows it: critical danger, high warning.",
      "On a phone the island is the alarm surface, so it buzzes, sounds (critical repeats until acknowledged) and announces new alarms, like AlarmList. Turn `feedback` off on one of them when both are on screen.",
    ],
  },
  tray: {
    group: "Robotics",
    examples: { file: "hooks", prefix: "Tray" },
    rules: ["Rows inside are radius 16 (md), so their corners stay concentric with the tray's 24. Dock and Dynamic island are built on it."],
  },
  // Hooks: each has a small live demo; the source is in the Source sheet.
  "use-long-press": {
    group: "Hooks & libraries",
    examples: { file: "hooks", prefix: "UseLongPress" },
    rules: ["Returns hold progress from 0 to 1. The emergency stop uses it for hold-to-stop-all."],
  },
  "use-slide-release": {
    group: "Hooks & libraries",
    examples: { file: "hooks", prefix: "UseSlideRelease" },
    rules: ["Drag, threshold and spring-back logic behind Slide to release."],
  },
  "use-presence": {
    group: "Hooks & libraries",
    examples: { file: "hooks", prefix: "UsePresence" },
    rules: [
      "Keeps an element (usePresence) or list items (usePresenceList) mounted while they leave, so an exit plays disappear instead of vanishing.",
      "It is how alarms fade out of a list and a save bar leaves after Save: not for anything that should simply hide at once.",
    ],
  },
  "use-hotkeys": {
    group: "Hooks & libraries",
    examples: { file: "hooks", prefix: "UseHotkeys" },
    rules: [
      "Single keys only where people work through a queue by keyboard (1 Yes, 2 No, ? help); everywhere else a shortcut takes a modifier (mod+k).",
      "Keys are ignored while someone types in a field, unless a binding sets allowInInput (Escape, mod+s).",
      "Turn it off with enabled: false while a dialog is open, so the dialog's own keys win.",
      "Show the keys on screen (Kbd) and in a ? dialog: a shortcut nobody can find does not exist.",
    ],
  },
  "use-ros": {
    group: "Hooks & libraries",
    wide: true,
    examples: { file: "hooks", prefix: "UseRos" },
    rules: [
      "One RosProvider per rosbridge server, high in the tree; the hooks share its one connection. The whole wiring, with the safety notes, is on the Connect to ROS page (/docs/ros).",
      "Show the connection's state in words and shape wherever the robot is driven or watched: Connected, Connecting (the blue spinner), Connection lost with Reconnect. A view that keeps the last message while the link is down must say so.",
      "Convert a message once per message (useMemo keyed on it): robot-map draws the grid again for every new array.",
      "Drive commands go through useRosPublisher on a Twist topic: it sends a zero Twist on unmount, on a hidden page and on a dropped link, and refuses a drive held through a drop until the stick is let go. rosbridge has no watchdog: the robot must stop by itself when commands stop arriving.",
      "Throttle what people read (throttleMs: 200 for a scan, 1000 for a battery); never throttle what someone is steering by.",
    ],
  },
  ros: {
    group: "Hooks & libraries",
    rules: [
      "Pure TypeScript, no React and no npm dependency: the rosbridge v2 client (createRosConnection) and the converters. use-ros is the React layer on top.",
      "The converters follow the components' documented conventions (robot-map's plan coordinates, REP 103, SI units); do not convert again before passing the result on.",
      "Only JSON (compression \"none\"): CBOR and PNG compression are not read. Large clouds and maps arrive as base64 or number arrays and are decoded here.",
    ],
  },
  "use-debounce": {
    group: "Hooks & libraries",
    examples: { file: "hooks", prefix: "UseDebounce" },
    rules: [
      "Debounce what goes to a server (a search, an autosave), never what the person sees: the text box updates on every key.",
      "300 ms for typing. A clear button and Enter do not wait: cancel() or flush().",
      "Answers can return out of order: keep only the one for the latest query.",
    ],
  },
  "format-number": {
    group: "Hooks & libraries",
    rules: [
      "Every number the screen writes goes through it: `formatCount(n, { locale })` for a count (whole things: rows, robots, matches), `formatNumber(n, { locale, ...options })` for any other number (a reading, a share, a price).",
      "A count is in full with grouping (135,287) in tables, headers, detail pages and figures; `compact` (135K; 14萬 in zh-TW) only on a tab's count, a chart's ticks or a compact chip, with the full number one step away.",
      "English without a locale, and for a tag Intl cannot read (\"en_US\"), so the server and the browser write the same digits. Never `toLocaleString()`: it follows the runtime's language (`lint:numbers` bans it in the kit).",
      "Write the result in `tabular-nums`.",
    ],
  },
  "clock-time": {
    group: "Hooks & libraries",
    rules: [
      "The one format every live component writes a time of day in: 24-hour with seconds (14:02:31), in `locale` and an optional `timeZone`.",
      "A time read during render differs between the server and the browser: read the clock with `use-now` and format what it returns.",
    ],
  },
  feedback: {
    group: "Hooks & libraries",
    rules: [
      "`feedback(name)` for a safety moment (stop sent, confirmed, unconfirmed, release, a new critical or high alarm), never `navigator.vibrate` directly: one pattern per moment, so the hand learns it.",
      "Critical repeats until acknowledged; low is silent. Neither replaces the screen: iOS has no vibration and sound needs a first tap.",
      "The stop, the slide to release, the teleop pad, the alarm list and the island call it already; call it yourself only for a moment the kit does not see (the stop confirmed by your app).",
    ],
  },
  "use-now": {
    group: "Hooks & libraries",
    rules: [
      "The clock for \"12 s ago\", for what has timed out, for a flood window: `useNow(intervalMs)`, null on the server and until the page hydrates, so the two renders agree.",
      "Render nothing time-based (or a placeholder) while it is null, never `Date.now()` in render.",
    ],
  },
  "use-reduced-motion": {
    group: "Hooks & libraries",
    rules: [
      "`usePrefersReducedMotion()` while mounted, `prefersReducedMotion()` in a handler. Under reduced motion only opacity changes and loops stop.",
      "CSS animations in the kit already follow the media query; use it for motion driven from JavaScript (a scroll, a canvas, a spring).",
    ],
  },
}

export type Item = (typeof registry.items)[number] & Entry

// What each component does with the keyboard beyond Tab. Radix supplies most of it; these tables say so out loud.
const keyboard: Record<string, [string, string][]> = {
  alarm: [
    ["`Tab`", "Move through each row's buttons, in the list's order (most urgent first)"],
    ["`Enter` / `Space`", "Acknowledge; focus moves to the next Acknowledge, or to the list's heading after the last"],
    ["`Enter` / `Space` on a group", "Open or close the folded low alarms or the shelved group"],
  ],
  trace: [
    ["`Tab`", "Focus a step that opens"],
    ["`Enter` / `Space`", "Open or close its details"],
  ],
  stepper: [
    ["`Tab`", "Focus a step people may go back to"],
    ["`Enter` / `Space`", "Go to that step"],
  ],
  scrollspy: [
    ["`Tab`", "Focus a section link"],
    ["`Enter`", "Scroll to the section and move focus to it"],
  ],
  "navigation-menu": [
    ["`Enter` / `Space`", "Open a panel"],
    ["`←` `→` `↑` `↓`", "Move between top-level items"],
    ["`Tab`", "Move into an open panel"],
    ["`Esc`", "Close the panel"],
  ],
  questionnaire: [
    ["`←` `→` `↑` `↓`", "Choose an option or a point on a scale"],
    ["`Space`", "Tick a checkbox"],
    ["`Enter`", "Next, or send on the last page"],
  ],
  "data-grid": [
    ["`Tab`", "Focus the grid region, then each header's menu and column edge, then the cells' controls"],
    ["`←` `→` `↑` `↓`", "Scroll the region"],
    ["`Enter` / `Space`", "Open a column menu, toggle a checkbox"],
    ["`←` / `→` on a column edge", "Narrow or widen the column by 16 px (`Shift`: 64 px)"],
    ["`Home` on a column edge", "The column's narrowest width"],
    ["`Enter` on a column edge", "Back to the column's first width"],
  ],
  sortable: [
    ["`Space`", "Lift or drop the focused item"],
    ["`←` `→` `↑` `↓`", "Move the lifted item"],
    ["`Esc`", "Cancel the move"],
  ],
  resizable: [
    ["`Tab`", "Focus a handle"],
    ["`←` `→` `↑` `↓`", "Resize"],
    ["`Home` / `End`", "Collapse or expand fully"],
    ["`Enter`", "Toggle a collapsible panel"],
    ["`F6` / `Shift+F6`", "Next or previous handle in the group"],
  ],
  "file-upload": [
    ["`Tab`", "Focus the drop zone"],
    ["`Enter` / `Space`", "Open the file picker"],
  ],
  autocomplete: [
    ["`↓` / `↑`", "Open the list, move between options"],
    ["`Enter`", "Pick the highlighted option"],
    ["`Esc`", "Close and restore the picked value"],
  ],
  "input-otp": [
    ["Type", "Fill the next box"],
    ["`Backspace`", "Clear the previous box"],
    ["`←` / `→`", "Move between boxes"],
  ],
  calendar: [
    ["`←` `→` `↑` `↓`", "Move by day or week"],
    ["`PageUp` / `PageDown`", "Previous or next month"],
    ["`Home` / `End`", "Start or end of the week"],
    ["`Enter` / `Space`", "Pick the focused day"],
  ],
  "time-picker": [
    ["`Enter`", "Commit the typed time (TimeInput)"],
    ["`Tab`", "Leave the field; the time is read on blur"],
    ["`Enter` / `Space`", "Open the list of slots (TimePicker)"],
    ["`Tab`", "In the list: one stop, on the picked slot (or the first free one)"],
    ["`↑` / `↓`", "Previous or next free slot"],
    ["`PageUp` / `PageDown`", "Six slots back or forward"],
    ["`Home` / `End`", "First or last free slot"],
    ["`Enter` / `Space`", "Pick the focused slot and close"],
    ["`Esc`", "Close and return focus"],
  ],
  "scroll-area": [
    ["`Tab`", "Focus the scroll region"],
    ["`←` `→` `↑` `↓`", "Scroll"],
    ["`PageUp` / `PageDown`", "Scroll by a page"],
  ],
  "toggle-group": [
    ["`Tab`", "Move into the group"],
    ["`←` `→` `↑` `↓`", "Move between items"],
    ["`Enter` / `Space`", "Turn the focused item on or off"],
  ],
  button: [["`Enter` / `Space`", "Activate"]],
  "segmented-control": [
    ["`←` / `→`", "Move to the previous or next segment"],
    ["`Enter` / `Space`", "Select the focused segment"],
  ],
  "theme-toggle": [
    ["`←` / `→`", "Move to the previous or next choice"],
    ["`Enter` / `Space`", "Choose the focused one"],
  ],
  "chip-group": [
    ["`←` / `→`", "Move between the chips (one Tab stop for the group; N more is a stop of its own)"],
    ["`Enter` / `Space`", "Choose the focused chip; on the chosen one, clear the choice. With several at once, turn the focused chip on or off"],
  ],
  facets: [
    ["`Tab`", "Move through the options of every facet, then its Show all; in the drawer, on to Clear all and Done"],
    ["`Space`", "Turn the focused option on or off"],
    ["`Enter` / `Space`", "On Show all N: unfold the facet and move to the first option it shows; on Show fewer: fold it again"],
    ["`Esc`", "Close the drawer and return to its button"],
  ],
  "search-field": [
    ["`/`", "Focus the search box from anywhere on the page, except while typing in a field"],
    ["`Enter`", "Open the results page with the query"],
  ],
  toggle: [["`Enter` / `Space`", "Turn on or off"]],
  "number-field": [
    ["`↑` / `↓`", "Step up or down"],
    ["`Shift`+`↑` / `Shift`+`↓`", "Step by the large step"],
    ["`PageUp` / `PageDown`", "Step by the large step"],
    ["`Home` / `End`", "Go to the minimum or maximum"],
    ["`Enter`", "Keep the typed value (kept in range)"],
  ],
  checkbox: [["`Space`", "Check or uncheck"]],
  "radio-group": [["`↑` `↓` / `←` `→`", "Move to and select the previous or next option"]],
  switch: [["`Enter` / `Space`", "Turn on or off"]],
  select: [
    ["`Enter` / `Space` / `↓`", "Open the list"],
    ["`↑` / `↓`", "Move between options"],
    ["Type a letter", "Jump to the first option starting with it"],
    ["`Enter`", "Choose"],
    ["`Esc`", "Close without changing"],
  ],
  slider: [
    ["`←` `→` / `↑` `↓`", "Step down or up"],
    ["`PageUp` / `PageDown`", "Step by 10%"],
    ["`Home` / `End`", "Go to the minimum or maximum"],
  ],
  tabs: [
    ["`←` / `→`", "Move to and open the previous or next tab"],
    ["`Home` / `End`", "First or last tab"],
  ],
  collapsible: [
    ["`Tab`", "Move to the trigger, then into the open region"],
    ["`Enter` / `Space`", "Open or close the region"],
  ],
  accordion: [
    ["`Enter` / `Space`", "Open or close the section"],
    ["`↑` / `↓`", "Move between section headers"],
    ["`Home` / `End`", "First or last header"],
  ],
  graph: [
    ["`Tab`", "Move into the graph (one stop, on the selected node or the first) and out"],
    ["`→` / `←`", "Horizontal: to an output / to an input of the focused node (the nearest one, or back where you came from)"],
    ["`↓` / `↑`", "Horizontal: next or previous node in the same column. Vertical: ↓ / ↑ follow the edges and ← / → move in the row"],
    ["`Home` / `End`", "First or last node"],
    ["`Enter`", "Select the node and highlight its path, or follow it when it is a link"],
    ["`Space`", "Select the node, links included"],
    ["`Esc`", "Clear the selection"],
  ],
  "streaming-chart": [
    ["`Tab`", "Move to the window, the Chart / Table switch, Pause, then the plot. Under 36 rem wide: the View options menu (⋯, both switches), Pause, then the plot"],
    ["`Space`", "On the plot, pause or resume"],
    ["`←` / `→`", "On the plot, move the view back or forward in time by a tenth of the window, pausing it (Shift: half the window)"],
    ["`End`", "On the plot, jump back to live"],
  ],
  "geo-map": [
    ["`Tab`", "Move into the map (one stop), then to its zoom buttons; with a goal placed, to Cancel and Send goal"],
    ["`←` `→` `↑` `↓`", "Move the map; in goal mode, move the crosshair (Shift: bigger steps)"],
    ["`+` / `-`", "Zoom in or out a level"],
    ["`0`", "Show all robots"],
    ["`Enter` / `Space`", "Goal mode: place the goal at the crosshair; once placed, send it"],
    ["`←` / `→` after placing a goal", "Turn the goal 15° (Shift: 45°)"],
    ["`Esc`", "Cancel the goal; otherwise clear the selection"],
  ],
  attitude: [["`Tab`", "Passes over both instruments: they show and never control, so nothing in them takes focus"]],
  "point-cloud": [
    ["`Tab`", "Move into the view (one stop), then to Reset view and Fit"],
    ["`←` / `→`", "Turn the view around the cloud"],
    ["`↑` / `↓`", "Look from higher or lower"],
    ["`Shift` + an arrow key", "Move the view"],
    ["`+` / `-`", "Zoom in or out"],
    ["`0`", "Reset the view"],
  ],
  "robot-map": [
    ["`Tab`", "Move into the map (one stop), then to its zoom buttons"],
    ["`←` `→` `↑` `↓`", "Move the map; in an edit mode, move the crosshair (Shift: bigger steps), or carry what was picked up"],
    ["`+` / `-`", "Zoom in or out"],
    ["`0`", "Show the whole site"],
    ["`Enter` / `Space`", "Edit modes: place a goal, a waypoint or a corner; pick up or drop a waypoint or corner. Enter also closes a zone"],
    ["`←` / `→` after placing a goal", "Turn the goal 15° (Shift: 45°); Enter sets it"],
    ["`Delete` / `Backspace`", "Remove the selected waypoint, or the zone's last corner"],
    ["`Esc`", "Cancel what is being drawn or carried; otherwise clear the selection"],
  ],
  "waypoint-editor": [
    ["`Tab`", "Move through Add waypoint, then each row's handle and row; the open row's fields, Duplicate and Delete; then the map and Save"],
    ["`Space` on a handle", "Lift the waypoint; `↑` / `↓` move it, `Space` drops it, `Esc` cancels (each move is announced)"],
    ["`Enter` / `Space` on a row", "Open or close its fields; its point is selected on the map"],
    ["`Delete` / `Backspace` on a row", "Delete the waypoint (Undo in the toast); focus moves to the next row"],
    ["`↑` / `↓` in a number field", "Step the value (Shift: a larger step)"],
    ["`←` `→` `↑` `↓`, `Enter`, `Delete` on the map", "The map's own keys: arrows move the crosshair, Enter adds a waypoint or picks one up, Delete removes the selected one (with Undo)"],
  ],
  "robot-model": [
    ["`Tab`", "Move into the view: one stop. Its buttons are for the pointer; 0 and F do the same"],
    ["`←` / `→`", "Turn the view around the robot"],
    ["`↑` / `↓`", "Look from higher or lower"],
    ["`Shift` + an arrow key", "Move the view"],
    ["`+` / `-`", "Zoom in or out (the wheel too, once the view has focus)"],
    ["`0`", "Reset the view"],
    ["`F`", "Fit the robot in view, in its pose now"],
  ],
  diagnostics: [
    ["`Tab`", "Move to the search box, the filter chips, then each group's and status's disclosure button"],
    ["`←` / `→`", "On the filter chips: move between All and Problems"],
    ["`Enter` / `Space`", "On a chip, choose it; on a disclosure button, open or close the group or the status's values"],
  ],
  tree: [
    ["`Tab`", "list: move between links and disclosure buttons. select: move into the tree (one stop) and out"],
    ["`Enter` / `Space`", "list: open or close a branch, follow a link. select: select the focused node"],
    ["`↑` / `↓`", "select: previous or next node on screen"],
    ["`→`", "select: open a closed branch; on an open one, move to its first child"],
    ["`←`", "select: close an open branch; otherwise move to the parent"],
    ["`Home` / `End`", "select: first or last node on screen"],
    ["Type letters", "select: move to the next node whose name starts with them"],
    ["`*`", "select: open every branch beside the focused node"],
  ],
  sidebar: [
    ["`⌘`+`B` / `Ctrl`+`B`", "Collapse the sidebar to its rail, or open it; on a phone, open or close the sheet. Not while typing"],
    ["`Tab`", "Move through the switcher, the links, the account and the edge button, top to bottom"],
    ["`Enter`", "Follow the link; on the switcher or the account, open its menu; on the edge button, collapse or expand the sidebar"],
    ["`Esc`", "On a phone, close the sheet and return focus to the trigger"],
  ],
  "image-grid": [
    ["`Enter` / `Space`", "Open the picture in the lightbox (or your own view, with onOpen), or pick it while picking"],
    ["`←` `→` / `↑` `↓`", "Pick one (a radio group, one Tab stop): move to the previous or next picture and pick it"],
    ["`Home` / `End`", "Pick one: the first or last picture"],
    ["`←` / `→`", "In the lightbox: previous or next picture"],
    ["`Esc`", "Close the lightbox and return focus to the picture's tile (your own dialog: `restoreFocus()`)"],
  ],
  "bar-list": [["`Tab`", "Move between the rows that are links; `Enter` follows one"]],
  "media-player": [
    ["`Space` / `K`", "Play or pause (Space on a focused button presses that button)"],
    ["`←` / `→`", "Back or forward 5 seconds, also on the timeline"],
    ["`J` / `L`", "Back or forward 10 seconds"],
    ["`Home` / `End`", "On the timeline: start or end of the clip"],
    ["`M`", "Mute or unmute"],
    ["`F`", "Full screen, or leave it (Esc leaves it too)"],
  ],
  "camera-feed": [
    ["`Space`", "Pause or resume the view (Space on a focused button presses that button)"],
    ["`F`", "Full screen, or leave it (Esc leaves it too)"],
  ],
  "camera-wall": [
    ["`Tab`", "Reach the cameras once (the last one you were on); Tab again leaves"],
    ["`←` `→`", "Previous or next camera"],
    ["`↑` `↓`", "The camera above or below, in the grid"],
    ["`Home` / `End`", "First or last camera on the page"],
    ["`PageUp` / `PageDown`", "Previous or next page of cameras"],
    ["`Enter` / `Space`", "Show the camera large, with the rest in a strip"],
    ["`Esc`", "Back to all cameras, on the page of the one you showed"],
    ["`Space` / `F`", "On the large camera: pause the view, full screen (as camera-feed)"],
  ],
  "annotated-image": [
    ["`Tab`", "Reach the picture's annotations once; Tab again leaves"],
    ["`←` `→` / `↑` `↓`", "Previous or next annotation, top to bottom and left to right"],
    ["`Home` / `End`", "First or last annotation"],
    ["`Enter` / `Space`", "Select the annotation"],
    ["`Esc`", "Clear the selection"],
  ],
  "grounded-text": [
    ["`Tab`", "Reach the picture's marks once, then each linked span in reading order; focus shows what it links to. GroundedTextBody has only the spans; its picture in the other panel keeps annotated-image's keys"],
    ["`←` `→` / `↑` `↓`", "On the picture: previous or next mark (as annotated-image)"],
    ["`Enter` / `Space`", "Pin the span or mark, so its links stay highlighted; again to let go. Pinning a span scrolls its marks into the picture's view"],
    ["`Esc`", "Let go of what is pinned"],
  ],
  dialog: overlayKeys,
  "alert-dialog": [
    ["`Esc`", "Cancel"],
    ["`Tab` / `Shift`+`Tab`", "Move between the actions; Cancel has focus first"],
  ],
  sheet: overlayKeys,
  popover: [["`Esc`", "Close and return focus"]],
  tooltip: [
    ["Focus", "Show"],
    ["`Esc`", "Hide"],
  ],
  command: [
    ["`⌘`+`K` / `Ctrl`+`K`", "Open or close the palette"],
    ["`↑` / `↓`", "Move between results"],
    ["`Enter`", "Run the highlighted result"],
    ["`Esc`", "Close and return focus"],
  ],
  pagination: [
    ["`Tab`", "Move between previous, the pages and next"],
    ["`Enter` / `Space`", "Go to that page"],
  ],
  breadcrumb: [
    ["`Tab`", "Move between the levels"],
    ["`Enter`", "Open that level"],
  ],
  "choice-field": [
    ["`Space`", "Toggle the focused checkbox or switch"],
    ["`↑` / `↓`", "Move between radio options"],
  ],
  "copy-button": [["`Enter` / `Space`", "Copy"]],
  "code-block": [
    ["`Tab`", "Move to Show (a secret), Copy, then the code when it scrolls"],
    ["`←` / `→`", "Scroll the focused code sideways"],
    ["`Enter` / `Space`", "On Show, show or hide the secret; on Copy, copy the code"],
  ],
  "log-viewer": [
    ["`Tab`", "Move into the lines (one stop: the newest line, or the first in view), then to an open line's Copy line, then the footer's Jump to latest and Copy lines"],
    ["`↑` / `↓`", "Previous or next line"],
    ["`PageUp` / `PageDown`", "A screen up or down"],
    ["`Home` / `End`", "First line, or the newest (End follows new lines again)"],
    ["`Shift` + an arrow key", "Select several lines"],
    ["`Enter` / `Space`", "Open or close the line; → opens, ← closes"],
    ["`C`", "Copy the selected lines (Ctrl/⌘+C too, when no text is selected)"],
    ["`/`", "Go to the search box"],
    ["`Enter` / `Shift`+`Enter`", "In the search box: next or previous match"],
    ["`Esc`", "Close the open line, or drop the selection back to one line"],
  ],
  "streaming-text": [
    ["`Tab`", "Move to Stop (Cancel while queued), the Reasoning button and Try again after an error"],
    ["`Enter` / `Space`", "Stop, open or close the reasoning, or try again"],
  ],
  message: [
    ["`Tab`", "Move to the turn's own controls: Try again after a failure, then its actions"],
    ["`Enter` / `Space`", "Try again"],
  ],
  "message-actions": [
    ["`Tab`", "Move through the switcher's ‹ and ›, Copy, Regenerate, Good and Bad, then the reasons; focus shows the quiet buttons"],
    ["`Enter` / `Space`", "Run the button; on Good or Bad, press or release it"],
    ["`←` / `→`", "In the reasons, move between them (one Tab stop); `Enter` or `Space` picks one"],
  ],
  "prompt-composer": [
    ["`Enter`", "Send (not while an input method is composing; not while the answer streams)"],
    ["`Shift`+`Enter`", "New line"],
    ["`Tab`", "From the text to the attach button, the toolbar, then Send (Stop while the answer streams)"],
    ["`Enter` / `Space`", "On Send or Stop: send, or stop the answer; on a file's ×: remove it, focus back in the text"],
  ],
  "message-scroller": [
    ["`Tab`", "Focus the conversation (one stop), then the turns' own controls, then Jump to latest"],
    ["`↑` / `↓`, `PageUp` / `PageDown`", "Scroll the focused conversation; scrolling up stops following"],
    ["`End`", "To the bottom: following starts again"],
    ["`Enter` / `Space`", "On Jump to latest: to the newest turn, focus back on the conversation"],
  ],
  citations: [
    ["`Tab`", "Move through the markers in the text, then the sources' links"],
    ["`Enter`", "On a marker, move to its source; on Back to citation N, return to the marker"],
    ["`Esc`", "In a source reached from a marker, return to that marker"],
  ],
  markdown: [
    ["`Tab`", "Move through the links, each code block's Copy and scroll box, and each table's scroll box"],
    ["`←` / `→`", "Scroll a focused code block or table sideways"],
    ["`Enter`", "Follow a link (a new tab for http(s), said to screen readers)"],
  ],
  filters: [
    ["`Enter`", "On + Filter, open the picker; on a part of a chip, reopen that step"],
    ["`↑` / `↓`", "Move through fields, operators or values; type to narrow them"],
    ["`Enter`", "Choose and go to the next step; in a value box, apply"],
    ["`Esc`", "Back one step; at the first step, close and return focus"],
    ["`←` / `→`", "In the saved views, move between views; `Enter` or `Space` chooses one"],
    ["`Enter`", "On Reset, put the view's rules back and move to its chip; on Save view, open the name box, where `Enter` saves and `Esc` closes"],
  ],
  "dropdown-menu": [
    ["`Enter` / `Space` / `↓`", "Open the menu"],
    ["`↑` / `↓`", "Move between items"],
    ["`Enter`", "Run the item"],
    ["`Esc`", "Close and return focus"],
  ],
  "context-menu": [
    ["`Shift`+`F10` / `Menu`", "Open the menu for the focused row or area"],
    ["`↑` / `↓`", "Move between items"],
    ["`→` / `←`", "Open or close a submenu"],
    ["`Enter` / `Space`", "Run the item, or tick it"],
    ["`Esc`", "Close and return focus"],
  ],
  "hover-card": [
    ["Focus", "Show the card after a moment"],
    ["`Esc` / `Tab` away", "Hide it"],
    ["`Enter`", "Follow the link"],
  ],
  banner: [["`Enter` / `Space`", "On the action, run it; on the close button, dismiss the notice"]],
  toast: [
    ["`F8`", "Move focus to the notifications"],
    ["`Esc`", "Dismiss the focused notification. In an open dialog, close the dialog; the notification stays"],
  ],
  "stop-button": [
    ["`Enter` / `Space`", "Stop this robot"],
    ["Hold `Enter` / `Space` 2 s", "Stop all robots"],
  ],
  "slide-to-release": [
    ["Hold `Enter` / `Space` 2 s", "Release; the thumb travels while the key is held"],
    ["Let go, or `Tab` away", "Cancel the hold: the thumb springs back. The page going to the background cancels it too"],
    ["`←` `→` `↑` `↓`", "Nothing: a release is never a step"],
  ],
  "teleop-pad": [
    ["Hold `↑` / `W`, `↓` / `S`", "Drive forward, back"],
    ["Hold `←` / `A`, `→` / `D`", "Turn left, right (with ↑ or ↓, curve)"],
    ["Release every drive key", "Stop"],
    ["`Space` / `Esc`", "Stop; keys still held do nothing until released"],
    ["`Tab` away", "Stop"],
  ],
}

// Robotics in the order an operator meets them, as on /docs/robotics: stop it (and the shell around the stop: dock,
// island, tray), drive it and send it, see what it sees, read its state, and what is drawn over a view. The groups made
// in 0.40 go from the general to the special: the table before its variants, the shape of a state before its words,
// the search before the filters. Other groups keep the registry's order.
const ordered = [
  ...["stop-button", "slide-to-release", "dock", "island", "tray", "teleop-pad", "robot-map", "geo-map", "waypoint-editor", "camera-feed", "camera-wall", "point-cloud", "robot-model", "attitude", "joint-state", "diagnostics", "viewport-overlay"],
  ...["table", "responsive-table", "data-grid", "list", "item", "description-list", "tree", "sortable", "log-viewer"],
  ...["status-glyph", "status-eyebrow", "badge", "tier-badge", "meter", "metric-card"],
  ...["search-field", "filters", "filter-form", "chip-group", "facets"],
  ...["format-number", "clock-time", "feedback", "use-now", "use-reduced-motion"],
]
const within = (name: string) => (ordered.includes(name) ? ordered.indexOf(name) : -1)

export const items: Item[] = registry.items
  .filter((i) => i.name in entries)
  .map((i) => ({ ...i, ...entries[i.name], keyboard: keyboard[i.name] }))
  .sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || within(a.name) - within(b.name))

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

/** An example's caption where the story's name cannot say it: component → story → caption. */
const captions: Record<string, Record<string, string>> = {
  badge: { BadgeDoAndDont: "Do and don't" },
  "status-eyebrow": { StatusInlineInRows: "InlineStatus in rows", StatusEyebrowOverTitle: "StatusEyebrow over a title" },
  "log-viewer": { LogViewerRosout: "/rosout", LogViewerZhTw: "Traditional Chinese (zh-TW)", LogViewerHundredThousand: "100,000 lines" },
  "streaming-text": { StreamingTextZhTw: "Traditional Chinese (zh-TW)" },
  "message-scroller": { MessageScrollerZhTw: "Traditional Chinese (zh-TW)" },
  "prompt-composer": { PromptComposerZhTw: "Traditional Chinese (zh-TW)" },
  "message-actions": { MessageActionsZhTw: "Traditional Chinese (zh-TW)" },
  message: { MessageZhTw: "Traditional Chinese (zh-TW)" },
  calendar: { CalendarMonthYearDropdowns: "Month and year dropdowns" },
  chart: { ChartAboveBelowZero: "Above and below zero" },
  "time-picker": { TimePickerTwelveHour: "12-hour clock" },
  diagnostics: { DiagnosticsAllOk: "All OK" },
  "teleop-pad": { TeleopPadConsole: "On a console" },
  "input-otp": { InputOTPPin: "PIN" },
  "tier-badge": { TierBadgeZhTw: "Traditional Chinese (zh-TW)" },
  "use-long-press": { UseLongPressHoldToConfirm: "Hold to confirm" },
}

// Words that keep their own spelling in a caption: proper names and acronyms.
const spelled = new Map(["Bluetooth", "Wi", "Fi", "AI", "URL", "SMS", "ROS", "CI", "WebGL", "PGM", "OTP", "PIN", "OK", "ID", "API", "CSV", "JSON", "PDF", "URDF", "TF", "LiDAR", "GPS", "IMU"].map((w) => [w.toLowerCase(), w]))

/** "ChartLine" → "chart-line": the item names in PascalCase, longest first, to tell a component's own stories apart. */
const pascalNames = () => items.map((i) => i.name.replace(/-/g, "")).sort((a, b) => b.length - a.length)

/**
 * "ThreeTiersWithPageAction" -> "Three tiers with page action", as Storybook shows it. On a component's page (`component`)
 * its name is dropped from the front ("DataGridStriped" → "Striped"), unless the story is named after another component
 * ("InputGroupSearch" on Input stays "Input group search"). Acronyms keep their capitals ("PointCloudNoWebGL" → "No WebGL",
 * "TraceCI" → "CI"); `captions` overrides the rest.
 */
export const storyTitle = (name: string, component?: string) => {
  const own = component && captions[component]?.[name]
  if (own) return own
  let rest = name
  if (component) {
    const owner = pascalNames().find((p) => name.toLowerCase().startsWith(p.toLowerCase()) && name.length > p.length && /[A-Z0-9]/.test(name[p.length]))
    if (owner && owner === component.replace(/-/g, "")) rest = name.slice(owner.length)
  }
  // An acronym is a run of capitals (WebGL and LiDAR included) before a capitalised word, a digit or the end.
  const words = rest.match(/WebGL|LiDAR|[A-Z]{2,}(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|[A-Z]|\d+/g) ?? [rest]
  return words.map((w, i) => spelled.get(w.toLowerCase()) ?? (i === 0 ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase())).join(" ")
}
