// "Which one when" for the sets of components people most often mix up. Each page asks its questions in order (the
// rule), compares the set in one table and gives each member one line. Drives the Choosing pages, their sidebar group,
// and the link on each member's component page.

export type Choice = {
  /** The registry item; its page is linked. */
  item: string
  /** The part of it this row is about, when not the whole item (AlertDialog in `dialog`). */
  label?: string
  cells: string[]
  /** One line: when it is the right one. */
  rule: string
}

export type ChoosingPage = {
  slug: string
  title: string
  /** The sidebar's name for it. */
  nav: string
  lead: string
  /** The questions to ask, in order, in one line. */
  rule: string
  columns: string[]
  choices: Choice[]
}

export const choosing: ChoosingPage[] = [
  {
    slug: "messages",
    nav: "Messages and alarms",
    title: "Banner, Alert, Toast, Alarm or Dialog",
    lead: "Five ways to tell someone something. They differ in what the message is about, how long it stays, and whether it stops the work.",
    rule: "Ask in order: must someone act at a robot? Alarm. Must they decide before going on? Dialog. Did they just do it? Toast. Is the whole app affected? Banner. Otherwise: Alert.",
    columns: ["About", "Stays", "Needs action", "Stops the work"],
    choices: [
      { item: "alarm", cells: ["An abnormal robot or system condition", "Until cleared and acknowledged", "Yes, by priority", "No; critical ones lead the list"], rule: "An operator must act: collision risk, e-stop, low battery on a mission." },
      { item: "dialog", cells: ["A decision the task waits on", "Until answered", "Yes, now", "Yes"], rule: "A short decision before going on: rename, a choice with two or three outcomes." },
      { item: "alert-dialog", label: "AlertDialog", cells: ["Confirming what cannot be undone", "Until answered", "Yes, now", "Yes"], rule: "Delete, revoke, force-remove: the confirm button names the consequence." },
      { item: "toast", cells: ["What the person just did", "4 to 8 s; failures until dismissed", "No; Undo at most", "No"], rule: "Saved, copied, mission started, with Undo where possible." },
      { item: "banner", cells: ["The whole app", "Until its condition ends", "At most one action", "No"], rule: "Maintenance, read-only mode, a licence about to end, no connection." },
      { item: "alert", cells: ["One page, form or record", "While its condition holds", "No", "No"], rule: "A form that cannot be saved, a robot that is offline, beside what it is about." },
    ],
  },
  {
    slug: "records-and-rows",
    nav: "Records and rows",
    title: "DescriptionList, Item, Table or DataGrid",
    lead: "Four ways to show records. They differ in how many records there are, whether people compare them across columns, and what they do with them.",
    rule: "One record? DescriptionList. Things to open, not compare? Item (List for robots with a live status). Compare across columns? Table, ResponsiveTable when phones see it, DataGrid when people sort, filter, select or hide columns.",
    columns: ["Holds", "Compare across rows", "People can", "On a phone"],
    choices: [
      { item: "description-list", cells: ["One record's fields, label above value", "No", "Read, copy a value", "Stacks"], rule: "A robot's site, firmware and last contact; a dataset's owner and size." },
      { item: "item", cells: ["A few things, each with media and actions", "No", "Open one, act on one", "As is"], rule: "People, files, integrations, settings links: one row per thing." },
      { item: "list", cells: ["Robots with a live status", "No", "Open one", "Made for it"], rule: "The robot shell's rows: status as a shape and a word, phone first." },
      { item: "table", cells: ["Many records, a few columns", "Yes", "Read, sort a column", "Scrolls sideways"], rule: "Fleet lists, event logs and user lists read on wide screens." },
      { item: "responsive-table", cells: ["The same, seen on phones too", "Yes", "Read, sort a column", "Becomes a grouped list"], rule: "One list of columns for both: never a second phone list written by hand." },
      { item: "data-grid", cells: ["Many records people work on", "Yes", "Sort, filter, select, hide, pin, resize, act in bulk", "Scrolls; pin the name column"], rule: "Fleets, events and datasets people sort, select and page through, thousands with virtual scrolling." },
    ],
  },
  {
    slug: "choices",
    nav: "Picking an option",
    title: "Select, Autocomplete, SegmentedControl or RadioGroup",
    lead: "Ways to pick from options. They differ in how many options there are, whether all of them should be seen at once, and when the choice takes effect.",
    rule: "On or off? Switch if it applies at once, Checkbox if saved with a form. Two to four that switch a view? SegmentedControl. Two to five in a form? RadioGroup. Five or more? Select. Too many to scroll, or from the server? Autocomplete.",
    columns: ["Options", "All in view", "Takes effect", "Where"],
    choices: [
      { item: "segmented-control", cells: ["Two to four, short", "Yes", "At once", "Toolbars, card headers"], rule: "Views of the same data, a sort order, a time window." },
      { item: "toggle-group", cells: ["Tools, one or several", "Yes", "At once", "Toolbars"], rule: "Formatting and tool modes; for views of data use SegmentedControl." },
      { item: "radio-group", cells: ["Two to five, worth reading", "Yes", "On submit", "Forms"], rule: "Exactly one of a few options whose words need to be read side by side." },
      { item: "select", cells: ["Five or more, or long names", "No", "On submit, or at once in a toolbar", "Forms, table rows, toolbars"], rule: "One of a known list too long to lay out." },
      { item: "autocomplete", cells: ["Too many to scroll, or loaded by search", "No", "When an option is picked", "Forms"], rule: "Searching a long or server list; typing alone never sets a value." },
      { item: "switch", cells: ["On or off", "Yes", "At once", "Settings"], rule: "A setting that applies now, with no Save button." },
      { item: "checkbox", cells: ["On or off, or several of a list", "Yes", "On submit", "Forms"], rule: "Agreeing, or ticking several; Select all with the partly-checked state." },
    ],
  },
  {
    slug: "overlays",
    nav: "Overlays",
    title: "Dialog, Sheet, Popover or Tooltip",
    lead: "Ways to show something over the page. They differ in how much they hold, whether the page behind stays usable, and whether they work on a touch screen.",
    rule: "A name or hint for a control? Tooltip. A few facts or one small control tied to a trigger? Popover. Actions on one thing? DropdownMenu. A short decision? Dialog. More than a few fields, or a record beside its list? Sheet.",
    columns: ["Holds", "Page behind", "Opens on", "Touch screens"],
    choices: [
      { item: "tooltip", cells: ["A control's name, a few words", "Usable", "Hover and focus", "Never shown: nothing needed goes in one"], rule: "Every icon button without a visible label." },
      { item: "hover-card", cells: ["A preview of what a link opens", "Usable", "Hover and focus on a link", "Never shown: the link's page has it all"], rule: "A person's or robot's card on a link that also goes to its page." },
      { item: "popover", cells: ["A few facts or one small control", "Usable; closes on a click outside", "A click", "Works"], rule: "A date picker, a filter, a definition with a link." },
      { item: "dropdown-menu", cells: ["Actions on one thing", "Blocked until it closes", "A click", "Works"], rule: "Row actions, the ⋯ overflow, the user menu; picking a value is a Select." },
      { item: "dialog", cells: ["A short decision or form", "Blocked", "An action", "Works; longer content is a Sheet"], rule: "Rename, a short form, a choice with two or three outcomes." },
      { item: "sheet", cells: ["Longer forms, a record's detail, filters", "Blocked, list kept in view", "An action", "A bottom sheet"], rule: "Detail or a form beside the list it came from; side=\"end\" is bottom on phones, right from 640 px." },
    ],
  },
]

/** The Choosing pages a component is compared on. */
export const choosingFor = (item: string) => choosing.filter((p) => p.choices.some((c) => c.item === item))
