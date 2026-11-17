// What each item is and when to reach for it, shown at the top of its page.
// `use`: the jobs it is for. `instead`: when another item fits better, naming it in backticks.

export type Overview = { what: string; use: string[]; instead?: string[] }

export const overviews: Record<string, Overview> = {
  "choice-field": {
    what: "One choice as a whole tappable row: a checkbox, radio or switch with its label, a description and an optional count. FieldSet groups them under one question.",
    use: ["Filters with counts.", "Settings that switch on and off.", "Several answers to one question in a form."],
    instead: ["A single control with a label and nothing else: `label` next to it.", "Picking one of many: `select`."],
  },
  meter: {
    what: "A level within a known range, like battery or storage, neutral until it crosses a threshold.",
    use: ["Battery, storage, signal strength, CPU.", "Inline in a table cell, or above a value in a card."],
    instead: ["Work that is under way and will finish: `progress`."],
  },
  "description-list": {
    what: "Facts about one thing as label and value pairs.",
    use: ["A robot's site, firmware and last contact.", "A dataset's owner, size and date."],
    instead: ["Many records to compare: `table`.", "One headline number: a stat in a `card`."],
  },
  breadcrumb: {
    what: "Where this page sits, as a row of links to the levels above it.",
    use: ["Pages two or more levels deep: a dataset inside a catalog, a robot inside a site."],
    instead: ["Moving between sections at one level: `tabs`.", "Top-level navigation: the app shell's sidebar."],
  },
  pagination: {
    what: "Where you are in a long list, and how to move through it.",
    use: ["Tables and lists with more rows than fit."],
    instead: ["A short list: show it all.", "Finding one record: `command` or a search field."],
  },
  "copy-button": {
    what: "Copies a value and confirms it in place: the icon becomes a check for 1.5 s.",
    use: ["IDs, references, install commands, coordinates."],
    instead: ["Sharing a link to the current page: the browser already does it."],
  },
  button: {
    what: "A control that does one thing now: save, send, start a mission. The label is a verb that says what happens.",
    use: [
      "The one primary action of a screen or dialog (primary).",
      "Other actions beside it (secondary, outline, ghost).",
      "An action that deletes or cannot be undone (destructive).",
    ],
    instead: [
      "Going to another page: a link, or `button` with the link variant.",
      "Switching a view of the same data: `segmented-control`.",
      "Turning one thing on and off: `toggle` or `switch`.",
    ],
  },
  "segmented-control": {
    what: "Two to four buttons joined into one, for switching between views of the same data. The selected one is inverted.",
    use: ["Map / list, chart / table, day / week.", "A filter with a few exclusive options in a toolbar."],
    instead: ["Sections of a page with different content: `tabs`.", "More than four options: `select`.", "A choice inside a form: `radio-group`."],
  },
  toggle: {
    what: "A button that stays pressed: on or off for one thing, such as a map layer.",
    use: ["Showing or hiding a layer, a column or a panel.", "Toolbar options like bold or follow robot."],
    instead: ["A setting that applies immediately and persists: `switch`.", "One choice among several: `segmented-control`."],
  },
  input: {
    what: "A single-line text field, 44 px high with 16 px text so phones do not zoom in.",
    use: ["Names, IDs, addresses, short free text.", "Inside a `field` for its label, hint and error."],
    instead: ["A number with a range or unit: `number-field`.", "An icon, unit or button inside the edge: `input-group`.", "Several lines: `textarea`."],
  },
  "input-group": {
    what: "An input with something inside its edge: a search icon, a unit, a clear or show-password button.",
    use: ["Search fields with an icon and a clear button.", "Values with a unit (m/s, %).", "Passwords with show / hide."],
    instead: ["A number you step through: `number-field`, which is built on it."],
  },
  "number-field": {
    what: "A number with a range, a step and a unit, with − and + buttons and full keyboard control.",
    use: ["Speed limits, battery thresholds, intervals, counts.", "Any value with limits the user should not exceed."],
    instead: ["A rough value where precision does not matter: `slider`.", "A number with no range, like an ID: `input` with inputMode numeric."],
  },
  textarea: {
    what: "A multi-line text field.",
    use: ["Notes, descriptions, incident reports."],
    instead: ["One line of text: `input`."],
  },
  label: {
    what: "The visible name of a control, wired to it so clicking the label focuses the control and screen readers announce it.",
    use: ["Beside a checkbox, radio or switch to make the whole row tappable.", "Any control not wrapped in a `field`."],
    instead: ["A label with a hint and an error: `field`, which includes it."],
  },
  field: {
    what: "A label, a control and one line below for the hint or the error, with ids and ARIA connected for you.",
    use: ["Every form control that needs a label, help or validation.", "Errors that grow in below the control without moving the layout."],
    instead: ["A group of checkboxes or radios under one question: a fieldset with a legend."],
  },
  checkbox: {
    what: "A box that is checked, unchecked or partly checked. Changes apply when the form is saved.",
    use: ["Agreeing to terms.", "Choosing several items from a list.", "Select all, with the partly-checked state."],
    instead: ["A setting that applies immediately: `switch`.", "Exactly one of several options: `radio-group`."],
  },
  "radio-group": {
    what: "A set of options where exactly one is chosen, all visible at once.",
    use: ["Two to five options the user should compare, like a patrol mode."],
    instead: ["A long list: `select`.", "Switching views in a toolbar: `segmented-control`.", "Yes / no: `switch` or `checkbox`."],
  },
  switch: {
    what: "On or off for a setting that takes effect the moment it changes, with no save button.",
    use: ["Notifications on, auto-dock on low battery, dark mode."],
    instead: ["A choice that is saved with a form: `checkbox`.", "Showing a layer or panel: `toggle`."],
  },
  select: {
    what: "A button that opens a list to pick one option from.",
    use: ["Six or more options, or options with long names.", "A compact choice in a table row or a toolbar."],
    instead: ["Two to five options worth seeing at once: `radio-group`.", "A long list the user needs to search: `command`."],
  },
  slider: {
    what: "A track with a thumb for picking a value or a range by dragging.",
    use: ["Volume, brightness, a rough range like a time window.", "Always with the current value shown beside it."],
    instead: ["An exact value or a value with a unit: `number-field`."],
  },
  badge: {
    what: "A short label or count in a status tone.",
    use: ["A count next to a title (3 alarms).", "A state word in a header, like Production or Offline."],
    instead: ["A state in a list row: `status-eyebrow` (InlineStatus).", "A message that needs a sentence: `alert`."],
    // CountBadge, in the same file, is the one way to draw a count next to a label.
  },
  card: {
    what: "One raised surface that holds a group of related content.",
    use: ["A robot's summary, a KPI, a settings section."],
    instead: ["Rows of similar items: `list` or `table` inside one card. Cards are never nested.", "Label and value pairs: `description-list`."],
  },
  avatar: {
    what: "A person's picture, or their initials when there is none.",
    use: ["The signed-in user, an assignee, an author in a log."],
    instead: ["A robot: its ID in a square tile, not a round avatar."],
  },
  separator: {
    what: "A hairline between groups of content.",
    use: ["Between sections of a menu, a card or a toolbar."],
    instead: ["Rows of a list: `list`, which draws inset dividers itself.", "Space alone, when the groups are already clear."],
  },
  progress: {
    what: "A bar that fills as work completes. Blue means in progress.",
    use: ["Uploads, map processing, a mission's completion.", "A value that is itself a status, like battery, in a status tone."],
    instead: ["Waiting with no measurable progress: `spinner`.", "Content still loading: `skeleton`.", "A level that is not work, like battery: `meter`."],
  },
  spinner: {
    what: "A turning indicator for work with no measurable progress. It appears only after 300 ms, so quick work never flashes it.",
    use: ["Inside a button while its action runs.", "A short wait for a response."],
    instead: ["Progress you can measure: `progress`.", "A page or list still loading: `skeleton`."],
  },
  "empty-state": {
    what: "What is missing, why, and the one action that fixes it.",
    use: ["A list with no items yet, search with no results, a page without permission."],
    instead: ["A temporary error inside a page: `alert`."],
  },
  table: {
    what: "Rows and columns for comparing many records at once, with tabular numbers.",
    use: ["Fleet lists, event logs, user lists on wide screens."],
    instead: ["Phones, or records with one main line: `list`.", "A trend over time: `chart`."],
  },
  list: {
    what: "Rows on one surface with inset dividers; status as shape plus word.",
    use: ["Robots, missions or settings on phones and in side panels."],
    instead: ["Many columns to compare: `table`."],
  },
  "status-glyph": {
    what: "Status as a shape plus a colour, so it reads without colour: filled circle in progress, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
    use: ["Next to a robot's name, in tables and on the map."],
    instead: ["A state with its word: `status-eyebrow`.", "An alarm: `alarm`, which has its own shapes."],
  },
  "status-eyebrow": {
    what: "The state word above a headline, and the same status inside a list row.",
    use: ["A robot's page title: Patrolling, then Patrol dog 7F3A.", "A row's state in a list."],
    instead: ["A count or label in a header: `badge`."],
  },
  skeleton: {
    what: "Placeholders for values not loaded yet. What is known shows first; only unknown values get a skeleton.",
    use: ["A page or card whose data is loading."],
    instead: ["An action in progress: `spinner` in its button."],
  },
  alarm: {
    what: "Alarms after ISA-18.2: three priorities, each with its own shape, colour and words, acknowledge and clear states, and a sorted list that announces new alarms.",
    use: ["Anything a person must act on: collision risk, e-stop, low battery on a mission."],
    instead: ["Feedback on what the user just did: `toast`.", "A note about the page that needs no action: `alert`."],
  },
  alert: {
    what: "A message inside the page in a status tone, with an icon, a title and a description. It stays while its condition holds.",
    use: ["A form that cannot be saved, a robot that is offline, a setting that has a consequence."],
    instead: ["Something a person must act on now: `alarm`.", "Feedback that goes away by itself: `toast`."],
  },
  toast: {
    what: "Short feedback on what the user just did, at the edge of the screen: 4 s, 8 s with an action, failures until dismissed.",
    use: ["Saved, copied, mission started, with Undo where possible."],
    instead: ["Anything that needs a person to act: `alarm`, never a toast.", "A state of the page: `alert`."],
  },
  tabs: {
    what: "Sections of one page under a row of labels; one section shows at a time.",
    use: ["A robot's Overview, Sensors and Logs."],
    instead: ["Two to four views of the same data: `segmented-control`.", "Sections the user may want open together: `accordion`."],
  },
  accordion: {
    what: "Sections that open and close in place.",
    use: ["Long settings, FAQs, details the user rarely needs."],
    instead: ["Sections that are each a full view: `tabs`."],
  },
  dialog: {
    what: "A centered panel for a short task or decision, blocking the page until it is done or closed.",
    use: ["Rename, a short form, a choice with two or three outcomes."],
    instead: ["Confirming something that cannot be undone: `alert-dialog`.", "Longer content, or on phones: `sheet`."],
  },
  "alert-dialog": {
    what: "A dialog that confirms an action that cannot be undone. The confirm button names the consequence.",
    use: ["Delete a route, stop all robots, revoke access."],
    instead: ["A reversible action: do it, and offer Undo in a `toast`."],
  },
  sheet: {
    what: "A panel that slides in: from the bottom on phones, from the side on wide screens.",
    use: ["Filters, a record's details next to a list, longer forms on phones."],
    instead: ["A short decision on desktop: `dialog`."],
  },
  popover: {
    what: "A small panel anchored to a control, with extra detail or a quick setting.",
    use: ["A date picker, a short form, an explanation with a link."],
    instead: ["A name for an icon button: `tooltip`.", "A list of actions: `dropdown-menu`."],
  },
  tooltip: {
    what: "The name of an icon-only control, on hover and on keyboard focus.",
    use: ["Every icon button without a visible label."],
    instead: ["Anything needed on touch screens, where tooltips never show: a visible label, or `popover`."],
  },
  chart: {
    what: "Line, area and bar charts in the categorical palette, with a crosshair tooltip, a legend and a table view.",
    use: ["Trends over time, comparisons between a few series."],
    instead: ["A single number: a stat in a `card`.", "Exact values to read or export: `table` (`ChartTable`)."],
  },
  command: {
    what: "Search and run from the keyboard: a filterable list, and the ⌘K palette that opens over any page.",
    use: ["The app's search for robots, pages and actions (AppShell `search`).", "Picking from a long list by typing."],
    instead: ["Filtering a list on the page as you type: `input-group` with a search icon.", "A few options: `select`."],
  },
  "dropdown-menu": {
    what: "A menu of actions on an item, opened from a button. Destructive actions go last.",
    use: ["Row actions in a table, the user menu, overflow (⋯) buttons."],
    instead: ["Picking a value: `select`.", "One obvious action: a `button`."],
  },
  "stop-button": {
    what: "The emergency stop: one touch stops, holding 2 s stops all; lying down it becomes wake and stand up.",
    use: ["Every screen that controls a robot, always in the same place."],
    instead: ["Any other destructive action: `button` with the destructive variant. Solid red belongs to the stop alone."],
  },
  "slide-to-release": {
    what: "Releases a stopped robot with a deliberate slide: past 85% it releases, short of that it springs back.",
    use: ["Releasing an emergency stop, where a tap would be too easy in a panic."],
    instead: ["Routine confirmations: `alert-dialog`."],
  },
  dock: {
    what: "The bottom bar of the control app in three tiers: the state action, this page's primary action, navigation.",
    use: ["Every page of the phone control app."],
    instead: ["Internal tools on desktop: the app shell's sidebar."],
  },
  island: {
    what: "The top of the control app: name, device status and notifications, each expanding on its own, with the most urgent alarm inside.",
    use: ["Every page of the phone control app."],
    instead: ["Internal tools: the app shell's top bar."],
  },
  tray: {
    what: "The shared frame of the island and the dock: radius 24, padding 8, gap 8.",
    use: ["Building a new floating bar that should match them."],
    instead: ["An ordinary panel: `card`."],
  },
  "use-long-press": {
    what: "A hook for press and hold, with progress from 0 to 1.",
    use: ["Hold-to-confirm actions, like stop all."],
    instead: ["A plain click: `button`."],
  },
  "use-slide-release": {
    what: "A hook with the drag, threshold and spring-back logic behind slide to release.",
    use: ["Building another slide-to-confirm control."],
    instead: ["Releasing a stop: `slide-to-release`, which uses it."],
  },
}
