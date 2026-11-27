// When to reach for each item, shown at the top of its page. What it is lives in one place: its registry.json
// `description` (lint:registry fails on a line here that repeats it). `use`: the jobs it is for. `instead`: when another
// item fits better, naming it in backticks.

/** `notes`: what an AI agent (or a new teammate) most often gets wrong with this item. Shown in its markdown twin. */
export type Overview = { use: string[]; instead?: string[]; notes?: string[] }

export const overviews: Record<string, Overview> = {
  "page-header": {
    use: [
      "The first thing in a page's content, under the app's top bar.",
      "A dataset, robot or site page whose counts and owner matter at a glance.",
      "A fact that opens what it counts: a MetaPill with `href`.",
      "A robot, job or dataset whose state matters: `status` with an InlineStatus.",
    ],
    instead: ["A title inside a card: the card's own heading.", "The app's own frame: `app-shell`.", "A section further down the page: `section-header`."],
  },
  "section-header": {
    use: [
      "A section of a page between the page header and its cards: Robots 1,284, with Add robot.",
      "A section inside a card, a sheet or a panel: Sensors 6, with Calibrate.",
    ],
    instead: [
      "The top of the page: `page-header`.",
      "The head of a card that shows data (a chart, a figure, a ring): `card` (CardDataHeader).",
      "A card's own title: `card` (CardTitle).",
    ],
    notes: [
      "Never hand-size a section title (text-base, text-lg, a weight of your own): pick the level instead.",
      "Pass the count as a number, not a string: it is written in full with grouping, and `locale` sets the separators.",
    ],
  },
  "chip-group": {
    use: ["A quick filter above a list: task, site, tier.", "A facet where people pick two or three values at once.", "Saved views as links, so the choice lives in the URL."],
    instead: ["A long list of options to tick: checkboxes in a `field`.", "A query of several fields and rules: `filters`.", "Two to four views of the same data: `segmented-control`."],
  },
  facets: {
    use: [
      "A catalog of datasets, recordings or robots narrowed by a few fixed facets: tier, task, site, sensor.",
      "A search results page with counts per facet value.",
      "The same facets on phones, from a Filters button in the toolbar (`FacetsDrawer`; the `sheet-filters` pattern is a whole example).",
    ],
    instead: [
      "One facet as a row of chips above a list: `chip-group`.",
      "Filters that must live in the URL and work before JavaScript: `filter-form`.",
      "A query of any field and operator: `filters`.",
    ],
    notes: [
      "It does not filter or count: compute `count` and the filtered rows from the same value.",
      "Hold the value in the page (or the URL) and pass it to both `Facets` and `FacetsDrawer`; each keeps its own only when uncontrolled.",
      "`Facets` is hidden below 1024 px and `FacetsDrawer` from 1024 px; change both breakpoints together through `className` if the page needs another.",
    ],
  },
  "filter-form": {
    use: ["A catalog or log whose filtered view should be shareable and survive Back.", "Any page where changing a filter resets the page number."],
    instead: ["Filters on data already in the browser: filter in state, as `data-grid` does."],
  },
  filters: {
    use: [
      "A long list or grid with many columns worth filtering: robots, incidents, runs.",
      "Views people tune and share: the rules go in the URL.",
      "Saved views over the bar, with `FilterViews`: one chip per view, Modified and Reset once a rule changes.",
    ],
    instead: [
      "A fixed set of known filters, laid out in a sheet or above a list: `filter-form`.",
      "One facet, one choice: `chip-group`.",
      "Text only: `search-field`.",
    ],
    notes: [
      "The value is a plain array of { id, field, operator, value }; filter rows with filterRows or matchRule, never by reading the chips.",
      "Boolean rules carry null; the operator (is_true, is_false) is the whole rule.",
      "Dates are \"yyyy-MM-dd\" strings, not Date objects, so the rules stay serialisable.",
      "FilterViews compares rules with rulesEqual (ids ignored, any order); it keeps no views itself: add the one onSave hands you to `views`.",
    ],
  },
  "search-field": {
    use: ["The search in an app's top bar.", "The query box on a results page (`live`)."],
    instead: ["Filtering a list on the page: an `input-group` with a search icon.", "Picking from a known list as you type: `autocomplete`."],
  },
  "theme-toggle": {
    use: ["Settings, or the corner of an app's top bar."],
    instead: ["A single on or off: `switch`."],
  },
  "route-progress": {
    use: ["Page changes in an app that loads data as you navigate."],
    instead: ["Work inside the page: `progress` or a `skeleton`."],
  },
  "share-bar": {
    use: ["Images by use, label sources, a dataset's tiers.", "Inside a table cell without a legend, or on its own with `legend`.", "Parts people follow to a filtered list: `href` on a segment makes its legend entry a link.", "A list with one bar per row under one ShareLegend."],
    instead: ["Values over time or many categories: `chart`.", "A single level within a range: `meter`.", "Counts per category, ranked: `bar-list`."],
  },
  "bar-list": {
    use: [
      "\"Items by class\" or \"files by format\" on a dataset's card, the top 5 to 10.",
      "Several small rankings on one data page, each inside its own card.",
      "The top classes of a row, inside a table cell.",
      "Rows that lead to the list filtered to them, with `href`.",
    ],
    instead: [
      "A level against a known range (storage, a quota): `meter`.",
      "How a whole splits into a few parts: `share-bar`.",
      "A ranked chart people explore, with axes and a table view: `chart` (the bar-chart-ranked pattern).",
    ],
    notes: [
      "It does not sort: pass the items largest first, as the query returns them.",
      "Never give rows their own colours or status colours; one series, `--chart-1`.",
      "Numbers are grouped (412,345) through formatNumber, in English without `locale`, so the server and the browser agree; pass `locale` for another language.",
      "No Card inside: it has no surface, so it goes into yours (CardDataHeader for the title).",
    ],
  },
  "annotated-image": {
    use: [
      "Reviewing a model's detections against ground truth, frame by frame.",
      "Comparing two versions of a model or of a dataset's labels on the same picture.",
      "Showing what a camera saw when an event fired, with the object that fired it.",
    ],
    instead: ["Many pictures at once, without marks: `image-grid`.", "Drawing or editing boxes: a labelling tool; this one shows and selects, it does not edit."],
    notes: [
      "Annotation coordinates are image pixels, not percentages or CSS pixels; `width` and `height` are the picture's natural size.",
      "Without `onSelectedChange` the picture is one role=img with a generated summary; with it, a group of buttons with aria-pressed. Do not wrap it in another button.",
      "Placeholders and tests draw the picture in code (an SVG data URI); never an external URL.",
      "`highlighted` and `onActiveChange` link the marks to something outside the picture; `grounded-text` uses them for words.",
      "To know a picture failed, use `onLoadError` with `src`; never pass your own `<img>` as `image` just to get its onError, which loses the failed state.",
    ],
  },
  "grounded-text": {
    use: [
      "A vision-language model's caption, where each object's name matches a box.",
      "A model's reasoning with grounding, where \"8 zebras\" is linked to 8 points.",
      "A review or evaluation note beside an annotated frame.",
    ],
    instead: ["A picture with marks and no text: `annotated-image`.", "Marks listed with their details: `annotated-image` with a details panel on select."],
    notes: [
      "Offsets are character offsets into `text` (JavaScript string indices, as Python's `start_idx` / `end_idx` for text without emoji). Spans must not overlap.",
      "`fromGrounding(text, groundings, { width, height, scale })` builds `annotations` and `spans`; `scale` is the range of the model's coordinates (1, 100, 1000), left out for pixels.",
      "Spans are role=button with aria-pressed (pinned), each described by where its marks are; marks are described by their words. Do not wrap either in a link or another button.",
      "The picture's words come from `imageLabels` (`annotatedImageLabels` in labels-zh-tw), the links' from `labels` (`groundedTextLabels`).",
      "`GroundedTextBody` is the text alone, to drive an annotated-image the screen already shows in another panel: `groundedImageProps` gives that picture its `highlighted`, `selectedId` and descriptions. Beside the picture from 42 rem of the component's own width.",
    ],
  },
  "media-player": {
    use: [
      "A robot's camera recording of a patrol or a mission.",
      "The clip attached to an incident, opened at the moment it fired.",
      "Reviewing what a robot saw before a stop, with its events marked on the timeline.",
    ],
    instead: [
      "A live camera feed: `camera-feed` (no timeline or speed; latency and connection state instead).",
      "One still frame with what a model saw in it: `annotated-image`.",
      "Many clips or pictures to pick from: `image-grid`, then the player for the one opened.",
    ],
    notes: [
      "It is a wrapper over `<video>` with no player library: what plays depends on the browser. WebM (VP9) and MP4 (H.264) cover current browsers; Chromium builds without proprietary codecs, such as Playwright's, play only WebM.",
      "Keys are captured only while focus is inside the player, so they never fight the page. The frame itself is a Tab stop; its focus ring is the page's, the controls' rings are the dark theme's.",
      "Captions come from `tracks` (WebVTT) and are drawn by the player above the controls, one track at a time (the `default` one, else the first). The browser's own caption rendering is turned off, because it would sit under the scrim.",
      "Every string is in `labels`, including the error reasons by MediaError code; `unavailable` is the reason when you know before loading that it cannot play.",
    ],
  },
  "camera-feed": {
    use: [
      "The camera panel of a robot's page or a teleoperation screen.",
      "A robot's view beside its map or its controls; for many cameras at once, `camera-wall`.",
      "Watching a robot's view with its detections drawn over it.",
    ],
    instead: [
      "A recording with an end, an incident clip: `media-player`.",
      "One still frame with what a model saw in it: `annotated-image`.",
    ],
    notes: [
      "It does not connect to anything: the app sets up WebRTC (or another transport) and passes the `MediaStream`, or a URL the browser plays by itself. MJPEG and HLS libraries are out of scope.",
      "Live, Stalled and Connecting come from the frames themselves (`requestVideoFrameCallback`, else `timeupdate`), so a stream that stays connected but stops sending pictures still reads Stalled. `status` is only what the transport knows: connecting, live or offline.",
      "Pause view freezes this screen only; the robot keeps streaming, and the feed says Paused until it resumes.",
      "The state is a shape and a word (a filled dot for Live, a triangle for Stalled, a slashed circle for offline); only Stalled has colour, and blue only spins while connecting. The dot never pulses.",
      "Every string is in `labels`, including `formatTime` for the last frame's time (24-hour clock by default; pass the site's time zone if the operator is elsewhere).",
      "`bare` is just the picture, for a feed inside something that names it and takes the keyboard (camera-wall's tiles); `onStateChange` reports each state once.",
    ],
  },
  "camera-wall": {
    use: [
      "A control room's wall of a site's robots, watched for anything that needs someone.",
      "Checking every robot of a fleet before a shift, then opening the one that looks wrong.",
      "A supervisor's tablet with the robots on one floor.",
    ],
    instead: [
      "One robot's camera on its page or a teleoperation screen: `camera-feed`.",
      "Recorded clips of an incident: `media-player`, or `image-grid` for stills.",
      "Robots' positions rather than their pictures: `robot-map`.",
    ],
    notes: [
      "It connects to nothing: `getSource(camera, { quality })` returns what camera-feed plays (a WebRTC MediaStream or a URL), and is called on render only for the cameras playing. Keep streams in a cache keyed by camera and quality; `onLiveChange` lists what plays, to close the rest.",
      "What plays: the focused camera, then tiles in the order shown, at most `maxLive`, skipping tiles off screen (one IntersectionObserver) and offline cameras. Tiles behind the focused camera are not drawn.",
      'A tile that stops playing keeps its last frame (or its `poster`), dimmed under "Paused to save bandwidth".',
      "Layout from the container's width, not the screen's: columns by count (1, 2×2, 3×3, 4×4) and by width (tiles at least 240 px), a page of cols × cols; under 560 px a list of tiles, and a focused camera takes the whole width. Full screen is the focused feed's own button (F).",
      "Each tile is a button in one roving Tab stop (arrows by tile and by row, Home, End, Page Up and Down), named with its camera, robot, state and alarm. Enter opens it large and moves focus to the feed; Esc comes back to the same tile, on its page.",
      "State changes are announced in one polite status, batched, at most every `announceEveryMs` (5 s): a camera that stalls, goes offline or comes back, each camera once in its latest state. Connecting to Live is not news.",
      "Status is camera-feed's shape and word on each tile; the alarm marker is the priority's shape and word in the picture's top-right corner, clear of the camera's burnt-in clock and of what camera-feed draws (octagon critical, triangle high, diamond low), never a tinted tile. The large view writes it beside All cameras, off the picture.",
    ],
  },
  "joint-state": {
    use: [
      "The arm panel of a robot's page, beside its camera.",
      "Checking an arm's pose after a protective stop: which joint ran into its limit.",
      "A cell's commissioning screen, watching each joint while it is homed.",
    ],
    instead: [
      "One level within a range (battery, storage, a single temperature): `meter`.",
      "Something that needs an operator to act (a joint fault, an over-torque stop): raise an `alarm`; this panel shows the pose, the alarm asks for the action.",
      "A value's history (a joint's torque over a shift): a line chart in `chart`.",
    ],
    notes: [
      "Plain props from `sensor_msgs/JointState` and the URDF: no ROS library. Map `name[i]`, `position[i]`, `velocity[i]` and `effort[i]` into one object per joint and add the URDF's `<limit lower upper effort>`.",
      "Near is inside `margin` (a fraction of the range, 5 % by default) at either end, in warning; at is within 0.1 % of the limit, and past is beyond it, both in danger. Each says which limit in words beside its icon (triangle, octagon); the marker takes the colour, the numbers never do.",
      "Stale is time alone: no new values in `joints` (or no new `updatedAt` stamp) for `staleAfterMs`, by the browser's clock. A rebuilt array with the same values is not an update, so a still arm reads Stale unless you pass `updatedAt`.",
      "`staleAfterMs={Infinity}` never goes stale. Stale values stay, grey, with the last update's time, so a frozen arm is never taken for a still one.",
      "On a narrow panel (a phone, a side column) each row stacks: name and position, then the track, then velocity and effort with their names. Wide, they line up in columns under one heading row.",
      "Every word is in `labels`, including the units as functions of the formatted number and `formatTime`; `locale` formats the numbers and the time.",
      "Pass the app's locale. Without it numbers are English on the server and in every browser (no hydration mismatch), and a tag Intl cannot read falls back to English.",
    ],
  },
  diagnostics: {
    use: [
      "The Health tab of a robot's page: which motor, sensor, computer or node is unwell, and what it reports.",
      "A field technician's first look at a robot that stopped: Problems narrows the tree to what is not OK.",
      "Checking a robot after commissioning or an update: everything OK, nothing stale.",
    ],
    instead: [
      "Something an operator must act on now (a motor fault that stopped the robot): raise an `alarm` as well; this panel shows the detail behind it.",
      "One robot's state in a list of robots: `status-glyph` with a word, from the worst level here.",
      "A reading's history (a motor's temperature over a shift): a line chart in `chart`.",
    ],
    notes: [
      "Plain props from `diagnostic_msgs/DiagnosticArray`: `diagnosticArrayToStatuses(msg)` from `ros` maps it, and `mergeDiagnostics(previous, next)` keeps each name's latest status, since /diagnostics brings a few at a time. No ROS library.",
      "The tree comes from the names' \"/\" paths, as the aggregator writes them (/diagnostics_agg). A group's level is the worst under it: Error, then Stale, then Warning, then OK. A partly stale group reads Stale, not Error as the aggregator has it, so nobody goes to fix a sensor that only stopped talking.",
      "Stale is timed by `receivedAt` (this browser's clock when the status arrived, never the header stamp) against `staleAfterMs`, 5 s by default as in the aggregator. The panel reads the clock once a second; pass `now` for a fixed picture (tests, screenshots, a bag played back).",
      "The summary counts each device once: leaves, and a group's own status only when it is worse than everything under it (an aggregator's missing-item error).",
      "Groups with a problem open by themselves; anything opened or closed by hand stays that way. Problems and search open every group they keep, and remember their own choices separately from the full tree.",
      "A status that turns ERROR is announced politely (a live region), at most once every 5 s: errors in between are read together, more than three as a count. What is in error when the data first arrives is not announced.",
      "Every word is in `labels`, with `summary` and `updatedAgo` as functions of numbers and the locale; `locale` formats the numbers. `labels-zh-tw` has `diagnosticsLabels`.",
    ],
  },
  "restricted-preview": {
    use: ["Thumbnails of a restricted dataset in a catalog or gallery."],
    instead: ["Data the viewer may not see at all: leave it out and say so in an `empty-state`."],
  },
  thumbnail: {
    use: [
      "The first column of a table of datasets, recordings or captures.",
      "The picture at the start of a list row or a card's row.",
      "A row from restricted data (faces, number plates, a tier): `restricted` with its `reason`.",
      "The cells of a media card's mosaic, filling CardMedia.",
    ],
    instead: [
      "Many pictures to browse, open or pick: `image-grid`.",
      "One large preview someone may choose to reveal: `restricted-preview`.",
      "A person or a robot: `avatar`.",
    ],
    notes: [
      "Never put `src` on a restricted thumbnail expecting it to load later: it is never fetched; render it unrestricted once the viewer may see it.",
      "It never takes focus; the reason's tooltip is for mouse users only, so write the reason (or a TierBadge) in the row where it matters.",
    ],
  },
  "image-grid": {
    use: [
      "A dataset's images, the frames of a run, a camera's snapshots.",
      "Picking a cover picture, or the frames to send for labelling.",
      "What was just uploaded, as a strip under the upload field.",
      "A gallery whose tiles open the app's own detail Sheet (with `onOpen`).",
    ],
    instead: ["Files that are not pictures, or a queue with progress: `attachment`.", "One preview someone must ask to see: `restricted-preview`."],
    notes: [
      "Placeholders and tests must not load external URLs; draw the picture in code (an SVG data URI).",
      "Selection is `aria-pressed` on each tile; do not add a separate checkbox.",
      "For your own detail view use `onOpen`; never build a second grid beside the kit's. The tiles still say they open a dialog, so open one, and call `restoreFocus()` on the grid's `ref` in its `onCloseAutoFocus` (with `preventDefault()`): a Radix dialog opened without a trigger otherwise drops focus on the page.",
      "For marks on the tiles use `renderTile` (an AnnotatedImage with `legend={false}` and `onLoadError={onError}`), never a hand-made grid; it holds no buttons of its own.",
    ],
  },
  "load-more": {
    use: ["Lists and galleries on a phone.", "Results that load in batches."],
    instead: ["A desktop table people jump around in: `pagination`."],
  },
  "robot-map": {
    use: [
      "Where the fleet is on a site right now: the map page of a fleet console, a robot's detail beside its position.",
      "A mission's route over the floor: planned (dashed) and travelled (solid).",
      "Zones people must know about: no entry, slow, charging.",
    ],
    instead: [
      "Robots across many sites, or outdoors on GPS: a map library with tiles.",
      "Time spent per zone: a heatmap (`heatmap-zones`).",
      "A camera picture with boxes: `annotated-image`.",
    ],
    notes: [
      "Offer `RobotMapList` beside `RobotMap` and share `selectedId` / `onSelect` between them; `lint:rules` asks for it in a block.",
      "Coordinates are metres from the plan's top-left, y down; `heading` is degrees clockwise from the plan's top (0 up, 90 right).",
      "From a ROS map frame (y up, yaw in radians counter-clockwise from +x) with the plan's bottom-left at (originX, originY): `x = xRos − originX`, `y = height − (yRos − originY)`, `heading = 90 − yaw × 180 / π`.",
      "`floorplan` is an image URL stretched over `width` × `height`, or SVG drawn in metres (add `vectorEffect=\"non-scaling-stroke\"` to keep hairlines thin when zoomed).",
      "By default the frame keeps the site's proportions (at most 75 % of the screen's height); `fill` makes it fill its parent, for a full-screen map.",
      "`grid` takes a ROS `nav_msgs/OccupancyGrid` as it arrives (`width`, `height`, `resolution`, `origin` from `info`; `data` as an `Int8Array` or `number[]`, row 0 at the bottom).",
      "Free cells are the map's surface, occupied ones a muted grey at their probability, unknown ones the no-data hatch; never a status colour.",
      "With no `width` and `height` the grid is the plan (`gridToPlan(grid)` gives its size and origin); under a plan of its own, `origin` places the plan's bottom-left in the map frame. Convert poses with `rosToPlan(frame, { x, y, yaw })`.",
      "The grid is drawn into an image once per new `data` array (one pass, encoded off the main thread), so a 4000 × 4000 map pans freely: keep the same array while the cells are unchanged, pass a new one when they change.",
      "`costmap` takes the same message and lays the accent's ramp (clear at 0, 60 % at lethal) under the grid's walls, or over the `floorplan`, with a legend in words. Unknown costs stay clear. One image encodes at a time; updates that arrive faster are skipped.",
      "`scans` takes ROS `sensor_msgs/LaserScan`s, each with its `robotId`, drawn as dots from that robot's current pose: beam i at `heading` turned `angleMin + i × angleIncrement` counter-clockwise. `scanToPoints(scan, robot)` gives the same points.",
      "NaN, ±Infinity and readings outside rangeMin–rangeMax are skipped; a robot with no heading draws no scan. The laser is taken to be at the robot's centre: transform the scan to the base frame first if it is not.",
      "Scan dots are the ink colour by default, darker than the grid's grey walls, so a hit reads against its wall; `scanColor=\"chart-1\"` sets them apart further. One path per scan, so 10 robots × 1080 beams stay smooth.",
      "Editing is controlled: `mode` is `view` (default), `goal`, `waypoints` or `zone`. The map draws the app's `goal`, `waypoints` and `zones` and reports `onGoal`, `onWaypointsChange`, `onZoneDraw` and `onZonesChange` (`editableZones`).",
      "It keeps only half-done input (a goal being pointed, an open zone) and drops it on a mode change. A cancelled move (Esc, a second finger, a cancelled pointer) re-sends the list unchanged.",
      "The selected or carried waypoint is tracked by value, so Delete and Esc still act on it after the app changes the list, or on none if it is gone.",
      "`onZoneDraw` gives the corners only: ask for the name and kind, then add the zone to `zones`.",
      "In an edit mode the primary pointer edits; the right or middle button and two fingers pan (a second finger also cancels), and the wheel and buttons still zoom. Only a click adds, never a drag, and one finger does not scroll the page while editing.",
      "Keyboard: in an edit mode the arrows move a crosshair (about 8 px, 40 with Shift, or `snap`) with its position beside it. Enter or Space places; a goal then turns 15° per ← or → (45° with Shift) until Enter.",
      "Enter or Space picks up a waypoint or, with `editableZones`, a corner; arrows carry it, Enter drops it, Esc puts it back. Delete removes the selected waypoint or a zone's last corner; Enter closes a zone of three corners or more.",
      'Each step is said in an aria-live region ("Goal set at 12.4, 8.0 m, heading 90°"), and the crosshair\'s position once the arrows rest for 400 ms.',
      "A banner top-left says what a click does and how to finish or cancel (and how to pan, from 480 px wide). Handles are 36 px targets with a mouse and 44 on touch.",
      "`snap` (metres) rounds every point placed or moved; none by default. Points stay on the plan.",
      "The waypoints' line is dashed grey while it is being drawn and the in-progress blue only with `waypointsPlanned`, once it is the route being driven. Goals and waypoints are ink, never a status colour; a drawn zone is a hairline outline like the others.",
      "For a waypoint list beside the map (as `waypoint-editor` does): `onWaypointEdit` reports added, moved or removed by index; `selectedWaypoint` / `onWaypointSelect` share the selection (a click selects in `view` mode too); `waypointMarks` draws heading ticks and problem marks.",
      "Pass `labels` (status words, zone kinds, instructions, positions, empty, loading, error) to translate.",
    ],
  },
  "waypoint-editor": {
    use: [
      "Planning a patrol or delivery route on a site before sending it to a robot.",
      "Changing a saved route: a new stop, a different order, a photo at the bay door.",
      "Showing a route to someone who can read it but not change it (`readOnly`).",
    ],
    instead: [
      "Watching a route being driven: `robot-map` with `paths` (and `route-progress` for how far along).",
      "One goal, sent now: `robot-map` with `mode=\"goal\"`.",
      "Reordering a plain list with no places: `sortable`.",
    ],
    notes: [
      "`value` is the saved route; the editor keeps a draft and calls `onSave` with it. Return a promise to keep Save busy; a rejection keeps the draft and says so. A new `value` replaces a clean draft and leaves one with unsaved changes alone. `onDirtyChange` lets the app warn before leaving; `defaultDraft` restores a draft kept across a reload.",
      'A waypoint is `{ id, name, at, heading?, action, dwell? }`. `at` is `{ kind: "plan", x, y }` in robot-map\'s metres or `{ kind: "geo", lat, lon }`; the map draws plan waypoints only, and geo legs use the haversine.',
      "`action` is `none`, `wait` (seconds), `dock`, `photo` or `custom` (a name the app runs); `dwell` is time to stay after it.",
      "`validateWaypoints(waypoints, { width, height, zones, minSpacing })`, exported for a server to check again, flags: no name, a custom action with no name, a position that is not a number, outside the plan, inside a `restricted` zone, or closer than `minSpacing` (0.5 m) to the waypoint before.",
      "Each problem shows on its row and its point; Save stays disabled and says why beside it.",
      "The estimate is the distance at `speed` (m/s) plus each wait and dwell (`routeDistance`, `routeDuration`). Docking and photos take what `dwell` says.",
      "Delete and Cancel throw nothing away silently: both show a toast with Undo, so the app needs a `Toaster`. Duplicate puts the copy 1 m beside the original (twice `minSpacing`), never on top of it.",
      "Keyboard: each row is a sortable handle (Space, arrows, Space) and a button that opens its fields; Delete removes the row with Undo and focuses the next. The map keeps its own keys.",
      "The editor's messages (added, duplicated, saved, the problem count once typing rests) go through one polite live region, at most one a second.",
      "Narrower than 768 px (a container query, so a sheet or a side panel counts) the list comes first and the map is a tab; the selected waypoint shows under the map with a Details button back to its row.",
      "ROS: `waypointsToPath` and `waypointsToNavigateThroughPoses` (from `ros`) send the route as `nav_msgs/Path` or Nav2's NavigateThroughPoses goal in the map frame; `pathToWaypoints` and `navigateThroughPosesToWaypoints` bring one back. Actions are the app's to run.",
    ],
  },
  "geo-map": {
    use: [
      "A patrol, farm or delivery fleet on satellite positioning: where each robot is, how good its fix is, and whether it is inside its work area.",
      "A robot that is offline or air-gapped: the grid in degrees needs no tile server.",
      "Sending a robot to a place on the map (Nav2's GPS waypoints, a GeoPoseStamped goal).",
    ],
    instead: [
      "A site's floor plan in metres, indoors: `robot-map`.",
      "Vector tiles, search, routing on roads, or a site across the antimeridian: a map library.",
      "One robot's position as a value: a `metric-card` with its coordinates in words.",
    ],
    notes: [
      "Offer `GeoMapList` beside `GeoMap` and share `selectedId` / `onSelect` between them.",
      "Coordinates are WGS 84 degrees as objects (`{ lat, lon }`), never pairs, so the order is never in doubt (GeoJSON writes lon, lat). `heading` is degrees clockwise from true north. From ROS (REP 103, ENU), `enuYawToHeading(yaw)`; from `sensor_msgs/NavSatFix`, spread `navSatFixToGeo(msg)` into the robot for `lat`, `lon`, `fix` and `accuracy`. Send a goal with `geoGoalToGeoPoseStamped(goal)` (or `geoGoalToNavSatFix`).",
      "`fix` is `rtk-fixed`, `rtk-float`, `dgps`, `gps` or `none`; `accuracy` is the horizontal accuracy in metres. NavSatFix cannot tell RTK fixed from float: `navSatFixToGeo` calls a GBAS fix within 5 cm fixed (`rtkFixedWithin`) and float otherwise.",
      "Coordinates are WGS 84 degrees as objects (`{ lat, lon }`), never pairs, so the order is never in doubt. `heading` is degrees clockwise from true north.",
      "From ROS: `enuYawToHeading(yaw)`; spread `navSatFixToGeo(msg)` into the robot for `lat`, `lon`, `fix` and `accuracy`. Send a goal with `geoGoalToGeoPoseStamped(goal)` or `geoGoalToNavSatFix`.",
      "The first view fits the whole working area (robots, fences and route), unless `center` and `zoom` are given; it is then kept, so robots driving about do not pull the map along. 0 and the fit button show all robots. The map is Web Mercator, north up, zoom 2 to 22 by default (`minZoom`, `maxZoom`).",
      "`data-tiles` on the map is `loading` or `ready` (every tile in view loaded or failed), for tests and screenshots that wait for the picture.",
      "`tileUrl` is a {z}/{x}/{y} template or a function from a tile to its URL (signed URLs, a local cache). `tileSize` is 256 or 512; past `tileMaxZoom` the deepest tiles are drawn larger.",
      "OpenStreetMap's public tile servers forbid heavy use: run or buy a tile server and pass its licence's words as `attribution`. The docs' stories use test tiles from `scripts/geo-tiles.mjs`, never a real server.",
      "Pass `labels` and `locale` to translate and format coordinates, accuracy and distances (`geoMapLabels` in `labels-zh-tw`).",
    ],
  },
  "point-cloud": {
    use: [
      "What a robot's LiDAR sees right now, beside its camera on a robot's page or a teleoperation screen.",
      "Checking a depth camera's mounting or calibration: is the floor flat, are the shelves where they should be.",
      "Reviewing a saved scan after an incident or while building a map.",
    ],
    instead: [
      "Where robots are on a site, in 2D: `robot-map`.",
      "What a camera sees: `camera-feed`, or `annotated-image` for one frame with detections.",
      "A mesh, a CAD model or a robot's URDF: a 3D-model item built on three.js, not this viewer.",
    ],
    notes: [
      "No 3D library: raw WebGL2, one interleaved vertex buffer (x, y, z and the colour position) drawn as `gl.POINTS` in one call. A new `points` array is uploaded once; the camera only redraws, on demand, while someone moves it.",
      "The camera fits the first cloud that has points and then stays where the person left it, so a live cloud at 10 Hz never yanks the view. Reset view goes back to the first angle; Fit keeps the angle and frames the cloud.",
      "The wheel zooms only once the view has focus (or with Ctrl, a trackpad pinch); one finger scrolls the page past it until it is tapped, as `robot-map` does.",
      "Goal mode is controlled: the map draws the app's `goal`, keeps only one not yet sent, and reports `onGoal` once confirmed. A goal in a keep-out or outside every allowed fence is never reported: the reason shows beside the disabled Send and is said. The app still checks it.",
      "Steps are said in an aria-live region, the crosshair's coordinates once the arrows rest for 400 ms, and fix changes in one sentence at most every `announceEveryMs` (3 s).",
      "Screen readers hear the view as its `label` and \"3D point cloud\", a name that stays the same while scans arrive; the point count and extent are its description, which changes at once with the view's state and otherwise at most every 5 s, so a live cloud is not read out at the sensor's rate.",
      "Without WebGL2 it says so in words and still gives screen readers the point count and extent. Its buffers, programs and timers are freed on unmount; a context the GPU takes away is asked back, and everything is rebuilt and uploaded again when it returns.",
      "The pure parts are exported (`pointCloudBounds`, `fitPointCloudCamera`, `orbitPointCloudCamera`, `panPointCloudCamera`, `zoomPointCloudCamera`, `pointCloudCameraForKey`, `pointCloudColorRange`, `packPointCloud`, `pointCloudWheelZoom`, `pointCloudPaletteSources`) for apps that frame their own overlays or decode in a worker.",
      "Every string is in `labels`, including the axes' words and `formatTime` for the last scan's time.",
    ],
  },
  "viewport-overlay": {
    use: [
      "A mode banner, a legend or a Stale notice over a map or a canvas.",
      "The zoom and fit group in the bottom left of a view.",
      "A message over a whole view (Reconnecting), on the scrim.",
      "Paused, or a camera's alarm, over a video picture (`variant=\"scrim\"` or Float).",
    ],
    instead: [
      "A message that a view has nothing to show: `empty-state`.",
      "A panel beside the view, not over it: `card`.",
      "A tray or a save bar at the bottom of a page: the Float recipe on the shell.",
    ],
  },
  "robot-model": {
    use: [
      "An arm's pose on its robot page, from /joint_states.",
      "Showing which joint is near its limit, or the pose a robot stopped in, beside the alarm that says so.",
      "Checking a robot's description: that the URDF loads and its joints turn the right way.",
    ],
    instead: [
      "Where robots are on a site: `robot-map`.",
      "What the robot sees: `camera-feed`.",
      "A few joint values to read at a glance: `data-pieces` or a table, which need no 3D.",
    ],
    notes: [
      "The kit's only three.js item: `three` and `urdf-loader` install with it and nowhere else. Load the component lazily (`next/dynamic` with `ssr: false`, or `React.lazy`) so other screens do not download three.js.",
      "The URDF comes as text (`urdf`) or a URL (`urdfUrl`); while the app is still fetching it, pass `loading`. `package://` paths resolve through `packages` (a map of package name to URL) or under `meshBaseUrl`.",
      "`up` is `\"z\"` for ROS (REP 103: x forward, y left, z up), and the axes gizmo says Forward, Left and Up. Pass `\"y\"` for a model exported y-up.",
      "It draws only when something changes (joint values, camera, size, theme) and frees its geometry, materials and WebGL context on unmount. A lost context says so and comes back by itself; one not back within 5 s says the view could not be restored, and Load again draws it on a new canvas.",
      "An update is a change of joint values or of `updatedAt`, not a new `joints` object, so an inline record rebuilt on each render neither keeps the view fresh nor flips it in and out of Stale. Without `updatedAt`, a robot holding still goes stale; pass the message's stamp.",
      "Mesh paths may carry a query string (`base.stl?v=2`). An absolute http(s) mesh URL in a URDF is fetched as written: a plain GET, with no credentials sent to another origin (a same-origin URL carries the page's cookies, as any fetch does). Check a URDF from an untrusted source before showing it.",
      "Without WebGL (or with `webgl={false}`, for a device that should not draw 3D) it lists each joint's position in words, highlighted ones marked: the same facts, nothing hidden.",
      "The view is one Tab stop with `role=\"img\"` and a summary (robot, joint count, highlighted joints with their values). Its reset and fit buttons are out of the Tab order; 0 and F do the same.",
      "Every string is in `labels`, including `jointValue` (degrees and millimetres by default), `poseValue` for planar and floating joints and `formatTime` for the last update.",
      "Colours come from the theme (`--chart-1` into `--track`, from 20 %) and follow theme and contrast changes; under forced colours (Windows High Contrast) the points are CanvasText on Canvas.",
      "The footer shows the scale with its ends in words, the point count and, once the camera has moved, how long the last frame took to draw on the GPU.",
      "A planar joint takes [x, y, θ] and a floating one [x, y, z, roll, pitch, yaw] (metres and radians); one number is x. They are written in millimetres and degrees per component (`x 120 mm, y −40 mm, θ 30°`).",
    ],
  },
  graph: {
    use: [
      "Lineage: Dataset v3, the label sets it was built from, and the raw captures under them.",
      "A training run's inputs (dataset, base model, config) and outputs (checkpoints, metrics, evaluations).",
      "A mission's steps when some run in parallel and meet again.",
    ],
    instead: [
      "Every node has one parent: `tree`, which reads as a list and opens and closes.",
      "Steps in one line, one after the other: `stepper` (a flow people go through) or `trace` (a run that happened).",
      "Events in time order: `timeline`.",
      "More than about 60 nodes, or a graph people edit: a dedicated library (React Flow, elkjs) with panning and zoom.",
    ],
    notes: [
      "Offer `GraphList` beside `Graph` (a Graph / List switch with SegmentedControl), as charts offer `ChartTable`; `lint:rules` asks for it in a block.",
      "Edges are `{ from, to }`, where `from` is an input of `to`. An edge that closes a cycle, points at a missing node or at itself is left out, with a warning in development.",
      "Node ids must be unique. Labels are plain text: they start each node's accessible name, which then lists its inputs and outputs (\"Box labels v7, 48,210 boxes, from Hall B captures, to Dataset v3\").",
      "`badge` is a string, not an element: it is drawn as the kit's outline tag and read in the node's name. Do not put a status in it; that is `status`.",
      "Pass `labels` (from, to, status words, instructions, inputs, outputs, loading) and `empty` to translate.",
    ],
  },
  trace: {
    use: [
      "What a robot did on a mission.",
      "An AI agent's tool calls and reasoning.",
      "Firmware rollouts, map builds and other CI-like runs.",
      "Audit trails of who changed what.",
    ],
    instead: [
      "Events at points in time with no duration: `timeline`.",
      "A sequence a person goes through: `stepper`.",
      "Thousands of log lines: `data-grid` with virtual rows.",
    ],
    notes: ["formatDuration(ms) gives 840 ms, 1.2 s, 2 m 05 s.", "Nest a Trace inside a TraceItem for sub-steps; size and total are inherited."],
  },
  marker: {
    use: ["Day breaks in an event feed.", "Where an operator took over or autonomy resumed.", "An unread line in a log.", "Dense tool-call or command logs."],
    instead: ["A plain divider with no label: `separator`.", "Steps with durations and details: `trace`."],
    notes: [
      "Marker reads as text, not a separator role, so the label is announced.",
      "MarkerRow takes a StatusGlyph `status`: only the glyph takes the colour, never the title; danger and warning are also spoken. Marker's `status` (warning or danger) colours its label.",
    ],
  },
  stepper: {
    use: ["Commissioning a robot.", "An import or upload wizard.", "A pre-shift checklist done in order."],
    instead: ["Sections of one page: `tabs`.", "Progress of a machine task: `progress`.", "Asking the questions themselves: `questionnaire`."],
    notes: ["value starts at 1; a value past the last step marks all done.", 'navigable="done" lets people click back to finished steps only.'],
  },
  timeline: {
    use: ["What a robot did on a shift.", "How an incident unfolded.", "Maintenance and release history."],
    instead: ["A sortable, filterable log: `data-grid`.", "Steps someone has to go through: `stepper`."],
    notes: ["`status` draws the status glyph (or colours the icon); colour only for warning and danger, never on the title.", "TimelineHeading groups events by day."],
  },
  scrollspy: {
    use: ["Long settings or detail pages.", "Docs pages.", "A robot's detail panel with many sections."],
    instead: ["Separate views people switch between: `tabs`."],
    notes: ["useScrollspy(ids) alone gives the current id for a custom display.", "The rail sits beside the content only from sm up (`hidden sm:flex`): on a phone it would leave the content a column a few words wide. Use `variant=\"pills\"` above the content there.", "Links move focus to the section, so keyboard users land there."],
  },
  sidebar: {
    use: [
      "The sections of an internal tool or a fleet console, on a laptop or a control-room screen.",
      "Switching between sites, workspaces or robots, in its header, above the sections they share.",
      "A section with a few pages of its own, listed under it while it is current.",
    ],
    instead: [
      "The whole frame (sidebar, top bar with title, search and environment, content and footer): the `app-shell` block, built on this.",
      "A website's header with a few areas: `navigation-menu`.",
      "Up to four sections of a phone app, in thumb reach: the `app-shell-mobile-tabs` block.",
      "A hierarchy from data (sites › zones › robots): `tree`.",
      "Sections of one page: `tabs` or `scrollspy`.",
    ],
    notes: [
      "One SidebarProvider around the Sidebar and the page beside it (SidebarInset); SidebarTrigger and useSidebar only work inside it. Give the provider the frame's height (`h-dvh`), or let the page scroll beside the sticky sidebar.",
      "Each SidebarMenuButton leads with its icon and passes `tooltip` with its name: on the rail the icon is all that shows. With a link, use asChild and put the icon, a <span> with the name, then SidebarMenuBadge or SidebarMenuTag inside the link, so the count is part of its name.",
      "Mark the current page with isActive (aria-current=\"page\"). For a page under a section, mark its SidebarMenuSubButton, give the section aria-current=\"true\", and isActive only on the rail, where its pages are hidden.",
      "The cookie is read on the client after hydration. With server rendering, read `sidebar_state` (SIDEBAR_COOKIE_NAME) on the server and pass it as defaultOpen, so a collapsed sidebar does not open for a moment first.",
      "Below 768 px it is a sheet, decided in JavaScript; pass isMobile to fix the form in a preview or a test.",
      'Two triggers can share the toggle: `show="expanded"` in SidebarHeader shows only while the column is open (never on phones), `show="collapsed"` in the top bar only while it is a rail or hidden (always on phones, hidden by CSS from 768 px before hydration).',
      'From the keyboard, the trigger that hides moves focus to the one that shows. `show="always"` (default) is a single trigger.',
      "SidebarRail is a window splitter beside the sidebar (role separator, in the Tab order): drag from 200 to 320 px (under 140 it folds to the rail), click or Enter to collapse and expand, ← and → by 16 px. Shown on pointer hover; always on touch.",
      "The width is kept in `<cookieName>_width`, first set by `defaultWidth`, and read as `--sidebar-width`. An inner frame clips, not the Sidebar, so the handle can sit beside the edge.",
    ],
  },
  "navigation-menu": {
    use: ["A marketing or docs site header.", "A portal with a few product areas."],
    instead: ["An app's own sections: `sidebar`.", "Actions on a thing: `dropdown-menu`.", "A path to the current page: `breadcrumb`."],
    notes: [
      "Use NavigationMenuLink (or navigationMenuTriggerStyle on it) for plain top-level links.",
      "viewport={false} puts each panel under its own trigger.",
    ],
  },
  questionnaire: {
    use: ["Pre-shift checklists.", "Incident follow-up questions.", "Feedback and site surveys."],
    instead: ["A form of named fields (name, address): `field`.", "Only showing progress through steps: `stepper`."],
    notes: ["Answers are keyed by question id; onSubmit gets them all.", "QuestionField draws one question on its own inside your form."],
  },
  "data-grid": {
    use: [
      "Fleets, events and datasets people sort, select and page through.",
      "Bulk actions on selected rows.",
      "Thousands of rows with virtual scrolling.",
      "Rows that open a detail panel underneath.",
    ],
    instead: ["A handful of static rows: `table`.", "A list of things with actions, not columns: `item`."],
    notes: [
      "Column header: DataGridColumnHeader gives sort, pin and hide in one menu.",
      "selectColumn() and expandColumn() are ready-made columns; renderSubRow goes in the table's meta.",
      "Build the table with useTable({ features: tableFeatures({ ...dataGridFeatures, …row models }) }); keep the file's \"use no memo\".",
      "Give each column meta.label so the visibility menu names it.",
      "Keep getRowId stable so selection survives sorting.",
      "data and columns must keep their identity between renders; an inline array (`rows.slice(0, 6)`, `[]`) re-renders forever once state auto-resets.",
    ],
  },
  "log-viewer": {
    use: [
      "A robot's /rosout on its page in a fleet console, for the operator or the engineer on call.",
      "A service's or a device's journal while commissioning or debugging.",
      "Reading back what a robot said around an incident, from a saved log.",
    ],
    instead: [
      "Conditions someone must acknowledge: `alarm`.",
      "Records people sort, select and page: `data-grid`.",
      "The steps of one run, with durations: `trace`.",
      "A command and its output to copy: `code-block`.",
    ],
    notes: [
      'A treegrid, not role="log": a log region would announce every line a virtual list adds while scrolling, and each line opens (aria-expanded).',
      "It has `aria-rowcount`, each line its `aria-rowindex`, one Tab stop and `aria-activedescendant`, so focus never sits on a line that scrolls away. New lines are announced in a separate status, at most every 5 s.",
      "`createLogBuffer({ maxLines, flushMs })` is a ring buffer outside React: append from a WebSocket or ROS callback; it commits at most every `flushMs` (100) and tells its subscribers once. The viewer subscribes with useSyncExternalStore and filters only on a commit. Lines keep a sequence number, so an open or selected line stays open while older ones are dropped.",
      'Following stops when the reader scrolls up, opens a line, uses the keyboard or goes to a match; it resumes at the end, with End, or with "Jump to latest" docked in the footer. While paused the top line stays put as old lines drop or filters change.',
      "Rows are measured, so wrapped and opened lines take their real height; a row is `--h-sm` (36 px with a mouse, 44 on touch). The toolbar is one height, the search field's `--h-md`.",
      "An opened line's detail is a band of its row: wide, the message cell spans the columns on a CSS subgrid, with names under the time and values under the level, and one Copy line. The footer's Copy appears only for two or more selected lines (C copies one).",
      "The rows component opts out of the React Compiler (\"use no memo\") because TanStack Virtual answers through methods on one object; the rest of the viewer compiles.",
      "Every word is in `labels`, including `ago` for time ago and `announce`; `locale` formats times and counts.",
    ],
  },
  citations: {
    use: [
      "An assistant that answers from manuals, maps or logs (retrieval), so an operator can check each claim.",
      "A generated report that quotes its evidence.",
      "Search answers that summarise several documents.",
    ],
    instead: [
      "Words that point at boxes or points on a picture: `grounded-text`.",
      "A list of links with no text citing them: `list` or `item`.",
      "A footnote in a document people write: an ordinary link.",
    ],
    notes: [
      "`Citations` is a provider with no element of its own: it holds the sources, which number is highlighted (`onActiveChange` reports it) and where a jump came from.",
      "A marker is an `<a href=\"#…\">` to its entry, so it works before the script; with it, focus moves to the entry (scrolled into view, instantly under reduced motion) and the way back appears there.",
      "The highlight follows the pointer (not touch) and keyboard focus; a click is a jump, not a hover.",
      "`citationLocation` writes a source's line: its `location`, or its URL's host without www. and its path.",
    ],
  },
  markdown: {
    use: [
      "An assistant's answer that is already whole: a saved conversation, a summary on a robot's page.",
      "A generated report or a model's explanation inside your own message layout.",
      "Release notes or help text an LLM writes for operators.",
    ],
    instead: [
      "A streamed answer with a status, Stop and reading aloud: `streaming-text` with `format=\"markdown\"`.",
      "Text written by people with formatting tools: a rich-text editor's own renderer.",
      "Code alone: `code-block`; a path or a key in a sentence: `code`.",
    ],
    notes: [
      "Supported: ATX headings, paragraphs, *em*, **strong**, ~~strike~~, `code`, fenced code (``` and ~~~), nested lists (two spaces under a number counts), links, <url> and bare http(s) URLs, blockquotes, GFM pipe tables with alignment, rules and line breaks (`breaks={false}` for CommonMark's two spaces).",
      "Shown as text: raw HTML, setext headings, indented code, reference links, footnote definitions, task lists.",
      "Parsing is linear: no backtracking patterns, code spans find their closers from one index, emphasis uses one stack per character, URLs are bounded, containers nest at most 8 deep and inline styles 24. A 100 KB hostile text parses in milliseconds.",
      "Incremental: `createMarkdownParser` keeps the finished blocks and parses only the last again when the text grows by appending; finished blocks keep their identity, so React skips them. A 20 KB answer in 200 chunks parses in a few ms in all. A text that changes before its last block starts is parsed again from the start.",
      "Strong is 500, as the kit writes emphasis in running text; headings are 18, 16 and then 14 px medium, the surface's levels, never bold.",
      "`parseMarkdown`, `parseInline`, `markdownToText` and `safeHref` are exported, for tests, previews and reading aloud.",
    ],
  },
  "streaming-text": {
    use: [
      "A VLM's caption, count or answer about a camera frame, in a playground or on a robot's page.",
      "An LLM's reply in an operator's assistant, where the answer arrives over server-sent events.",
      "Any single answer that takes seconds and should show it is working and can be stopped.",
    ],
    instead: [
      "Numbers arriving over time: `streaming-chart`.",
      "Lines a program writes as it runs: `log-viewer`.",
      "Work with a known end and no text to show yet: `progress` or a Button's `loading`.",
      "Formatted text alone, already whole (a saved answer, a generated report): `markdown`.",
    ],
    notes: [
      "Controlled: the product appends each chunk to `text` and sets `phase`. React batches the renders, and each paragraph is its own element, so only the last one changes while it grows. There is no imperative append: token rates do not need one.",
      "The status row keeps its height (`--h-md`) in every phase and sits above the text, so Stop never moves while the answer grows; the Spinner appears after 300 ms in a fixed box and stands still under reduced motion.",
      "The status words are a polite live region (role=status): each phase is said once. With `announce=\"text\"` (default) a second polite region reads the answer in whole sentences, at most every `announceEveryMs` (5 s), and the rest when it ends; an answer that mounts finished is not read.",
      "When Stop leaves with the phase it ended and had focus, focus moves to the status words (tabIndex -1), not the top of the page.",
      "Timing: durations given (`durationMs`, `firstTokenMs`) win over the timestamps (`startedAt`, `firstTokenAt`, `finishedAt`); `streamingTextTiming` and `formatDuration` are exported.",
      "Every word is in `labels` (`streamingTextLabels` in `labels-zh-tw`), including `queued`, `done` and `stopped` as functions; `locale` formats the numbers.",
    ],
  },
  message: {
    use: [
      "An operator's assistant: the person's question and the assistant's streamed answer.",
      "An agent's tool calls shown in the conversation, each a Tool turn with a Trace inside.",
      "A system note at the start of a conversation: what the assistant may and may not do.",
    ],
    instead: [
      "One answer on its own, with no conversation around it: `streaming-text`.",
      "An agent run read step by step: `trace`, or the `agent-trace` block.",
      "Comments people leave on a record: `timeline`.",
    ],
    notes: [
      "An <article> named by `labels.label` (\"Assistant, 14:02\"), so a screen reader's list of articles is the conversation's outline. The role word comes first in the name and in the header.",
      "The status row is a polite live region that is always present: a turn that fails or is stopped while on screen is said once; turns that mount already failed are not read.",
      "`align=\"end\"` works through a container query (`@2xl`, 42 rem): message-scroller's list is the container; put `@container` on your own list's parent.",
      "Every word is in `labels` (`messageLabels` and `messageMetaLabels` in labels-zh-tw); `MessageMeta` takes `locale`.",
    ],
  },
  "message-actions": {
    use: [
      "Every assistant answer in a conversation.",
      "An answer whose quality feeds an evaluation: Good and Bad with reasons.",
      "An answer people regenerate until it suits them: the ‹ 2 / 3 › switcher.",
    ],
    instead: [
      "One value to copy beside a label: `copy-button`.",
      "Actions on a record in a list: `dropdown-menu` (DropdownMenuMoreTrigger).",
      "A form people fill in about an answer: `questionnaire`.",
    ],
    notes: [
      "Controlled or not: `feedback` and `reason` with their callbacks, or `defaultFeedback` and nothing else; the callbacks fire either way.",
      "The hidden state is opacity only, inside `(pointer: fine) and (not (any-pointer: coarse))` and only while neither the turn (Message's `group/message`) nor the row is hovered or focused, so the buttons keep their place, stay in the Tab order and show on focus.",
      "Copy is the kit's CopyButton: it says Copied, or why it could not copy, in a polite region.",
      "Every word is in `labels` (`messageActionsLabels` in labels-zh-tw); `locale` formats the version numbers.",
    ],
  },
  "prompt-composer": {
    use: [
      "The foot of an assistant panel or a side copilot.",
      "A prompt to a vision model about a camera frame, with the frame attached.",
      "Any free-text request to an agent that may take files.",
    ],
    instead: [
      "A one-line search: `search-field`.",
      "A long note on a record, with no sending: `textarea` in a `field`.",
      "Picking files with no message: `file-upload`.",
    ],
    notes: [
      "Pinning on phones without fixed positioning: make the page a flex column `h-dvh` (the conversation `min-h-0 flex-1` and scrolling, the composer last, with `pb-[env(safe-area-inset-bottom)]` on its wrapper), and add `interactive-widget=resizes-content` to the viewport meta so the on-screen keyboard shrinks the page instead of covering the composer. The text is 16 px, so iOS does not zoom into it.",
      "Growth: the box is measured on every change, up to `maxRows` lines (8), then it scrolls; no `field-sizing`, which Firefox lacks.",
      "Send stays focusable when it cannot send (aria-disabled) and its description says why, so a keyboard or screen reader learns the reason where they are; a press shows the reason under the box in a polite region.",
      "The tray is uncontrolled: `onFilesChange` reports it; it empties on a send that is not refused. Upload progress belongs to your own Attachment rows once sent.",
      "Every word is in `labels` (`promptComposerLabels` in labels-zh-tw), including the attachment chips' words; `locale` formats the counts.",
    ],
  },
  "message-scroller": {
    use: [
      "The middle of an assistant panel, between its header and the prompt composer.",
      "A side copilot in a Sheet, in a flex column that ends with the composer.",
      "Any conversation that grows at the bottom while someone reads further up.",
    ],
    instead: [
      "Lines a program writes as it runs: `log-viewer`.",
      "A fixed list people scroll without anything arriving: `scroll-area`.",
      "Events in time order with no conversation: `timeline`.",
    ],
    notes: [
      "No dependencies: following, letting go and scroll anchoring are a scroll listener, a ResizeObserver and a MutationObserver. The browser's own `overflow-anchor` is off on the viewport (Safari has none), so every browser behaves alike.",
      "At the bottom means within 32 px. Only a move up lets go, so content growing under a following view never stops it.",
      "Announcements: a turn appended complete is read once (\"Assistant, 14:02: …\", at most 600 characters); one that streamed is read when it ends only if it holds no StreamingText. Turns present at mount, put in front, or with `role=\"user\"` are never read.",
      "On phones: put it and the prompt composer in a flex column 100dvh tall, the scroller `min-h-0 flex-1`; the on-screen keyboard then shrinks the scroller, not the composer.",
      "Every word is in `labels` (`messageScrollerLabels` in labels-zh-tw); `locale` formats the count.",
    ],
  },
  sortable: {
    use: ["Waypoint and patrol order.", "Rule priorities.", "Column order, camera layout, playlist steps."],
    instead: ["Ordering by a value (date, name): sort a `table` or `data-grid`.", "Moving items between lists: compose dnd-kit directly."],
    notes: ["Order lives in your state; onValueChange gets the new array.", "Touch drags start after a short press so the page still scrolls."],
  },
  resizable: {
    use: ["A map beside a robot list.", "A camera above an event log.", "An editor beside its preview."],
    instead: ["A panel that slides in over content: `sheet`.", "Fixed app chrome: the app-shell block."],
    notes: ["autoSaveId on the group remembers sizes in the browser; give each panel an id.", "collapsible panels collapse when dragged past their minSize.", "Double-click a handle to put its panel back to its default size."],
  },
  "file-upload": {
    use: ["Maps, logs and recordings uploaded to a site.", "A single photo or avatar.", "A compact attach row in a form."],
    instead: ["Showing files already attached: `attachment`."],
    notes: ['accept uses the input\'s syntax: "image/*,.pgm".', "The upload itself and its progress are yours; FileUpload only selects."],
  },
  attachment: {
    use: ["Upload queues with progress.", "Files attached to an incident or message.", "Image strips with previews."],
    instead: ["Picking files: `file-upload`.", "A file browser with many columns: `data-grid`."],
    notes: ["variant row, chip or image; status idle, uploading, done or error.", "Pass previewUrl (an object URL) for images."],
  },
  "file-type": {
    use: ["File rows, upload queues and file browsers.", "Showing the format of a log, map or model."],
    instead: ["A generic icon surface: `icon-tile`."],
    notes: ["familyOf(name) tells you the family (map, model, data…) for your own logic.", "label overrides the written extension (db3 → ROS2)."],
  },
  autocomplete: {
    use: [
      "Picking a robot, site, user or dataset from a long list.",
      "Searching a server as you type, with a loading state.",
      "Grouped suggestions, such as robots by kind.",
    ],
    instead: ["Fewer than about 10 options: `select`.", "A command that does something: `command`.", "Free text with no list: `input`."],
    notes: [
      "The value is the option's value; the field shows its label.",
      "Pass filter={false} and onQueryChange when the server filters, and loading while it works.",
      "Typing alone never sets a value: only picking an option does.",
    ],
  },
  "input-otp": {
    use: ["Two-step sign-in and verification codes.", "Pairing a robot with a code from its screen.", "A short PIN to release a stop."],
    instead: ["A password: `input` with type password.", "A number with a range: `number-field`."],
    notes: [
      "Set pattern (REGEXP_ONLY_DIGITS) and maxLength to the code's length.",
      "autoComplete is one-time-code by default so phones offer the SMS code.",
      "The caret blinks only while focused and stops under reduced motion.",
    ],
  },
  "phone-input": {
    use: ["On-call numbers for alarm escalation.", "Site and customer contacts."],
    instead: ["A number that is not a phone (an ID, a count): `input` or `number-field`."],
    notes: [
      "Pasting a number that starts with + switches the country.",
      "Limit countryOptions to the countries you operate in to shorten the list.",
      "libphonenumber-js adds about 150 KB; load the page that needs it lazily if size matters.",
    ],
  },
  calendar: {
    use: ["Inline on a scheduling page.", "Inside a popover: use `date-selector`, which wraps it.", "Showing which days have events."],
    instead: ["A date field in a form: `date-selector`.", "A time of day: `time-picker`."],
    notes: [
      "Pass today in tests and stories so screenshots stay stable.",
      "disabled takes matchers: { before: date }, { dayOfWeek: [0, 6] }.",
      'captionLayout="dropdown" with startMonth and endMonth for distant dates.',
    ],
  },
  "date-selector": {
    use: ["A day or range in a form or a filter bar.", "Event and report ranges with presets."],
    instead: ["A calendar that is always visible: `calendar`.", "A time: `time-picker`."],
    notes: [
      "Values are Date objects (DateRange for ranges); format with date-fns.",
      "clearable adds an × that sets the value to undefined.",
      "DateRangePicker shows two months; pass numberOfMonths={1} in narrow panels.",
    ],
  },
  "time-picker": {
    use: ["Schedules, quiet hours and charging windows.", "Opening-hour slots with some taken.", "Fast entry for people who know the time."],
    instead: ["A date: `date-selector`.", "A duration: `number-field` with a unit."],
    notes: [
      "step sets minutes between slots; min and max bound them.",
      "TimeInput marks unreadable or out-of-range text invalid and keeps the text so it can be fixed.",
      'A value that is not "HH:mm" reads as no value.',
    ],
  },
  item: {
    use: [
      "Lists of people, files, integrations or settings links.",
      "Menus where each whole row is a link.",
      "A compact card-like record with a header and footer line.",
    ],
    instead: [
      "A robot with live status in the robot shell: `list`.",
      "Rows the user sorts or filters by column: `table`.",
      "Key and value pairs: `description-list`.",
    ],
    notes: [
      "A row becomes a link only through asChild on an <a>; never put onClick on a static Item.",
      "ItemGroup has role list; wrap each Item in an element with role listitem.",
      "ItemTitle is one line: put the text in a <span> first so it truncates and badges stay whole.",
    ],
  },
  "icon-tile": {
    use: ["The media of a row or card.", "A status at a glance: a failed run, a warning.", "A feature or category heading."],
    instead: ["A person: `avatar`.", "A status next to text in a row: `status-glyph` or `status-eyebrow`."],
    notes: [
      "Use the soft or solid tones only for status, never to decorate a category.",
      "An interactive tile (asChild link) needs its own aria-label.",
      "IconTileDot needs a label; it is announced as an image.",
    ],
  },
  "text-diff": {
    use: [
      "A base model's caption or answer against a fine-tuned one.",
      "A label, prompt or description before and after an edit.",
      "Reviewing a proposed change to a text before accepting it.",
    ],
    instead: ["A change of one value (a number, a setting): before → after in a timeline or audit row.", "Code: a code diff viewer with lines and syntax."],
    notes: [
      "Never colour the changes green and red: a removal is not an error. The shape (block and underline, strike) carries the meaning.",
      "Screen readers hear added and removed around each change; pass `labels` to translate them and the summary.",
      "diffWords and diffStats are exported for counts elsewhere (a table of eval results).",
    ],
  },
  kbd: {
    use: ["Shortcut hints in menus, tooltips and search fields.", "A keyboard reference list.", "Instructions like Hold Space to stop all."],
    instead: ["A code value or ID in a sentence: `code`."],
    notes: [
      "Icon-only keys (arrows) need sr-only text inside; a <kbd> cannot take an aria-label.",
      "Inside a tooltip the key takes the tooltip's colours automatically.",
      "pressed (from useHotkeys' `pressed`) makes the key sink and its edge darken for a moment; it is a visual echo, so the result of the key still has to be said on screen.",
    ],
  },
  "button-group": {
    use: [
      "A split button: the main action and a menu of variants.",
      "A stepper: minus, value, plus.",
      "Prev and next, zoom in and out, playback controls.",
      "A search field with its scope menu and button.",
    ],
    instead: [
      "One choice among several that stays selected: `toggle-group` or `segmented-control`.",
      "Unrelated actions in a toolbar: separate buttons with a gap.",
    ],
    notes: [
      "Filled buttons need ButtonGroupSeparator between them; outline buttons share their edge.",
      "ButtonGroupText is not interactive; use it for a value or count.",
      'Set orientation="vertical" for map zoom and tool palettes.',
    ],
  },
  "scroll-area": {
    use: ["A long log or list inside a card.", "A row of thumbnails that pans sideways.", "A wide table inside a panel."],
    instead: ["The whole page: let the page scroll.", "A data table with sorting: `table`, which scrolls by itself."],
    notes: [
      "Without a height it never scrolls; set h-* or max-h-*.",
      "fade hides the edges with a mask; do not use it when the first or last line must always be legible.",
    ],
  },
  "toggle-group": {
    use: ["A tool or a mode with a single choice: what the next tap on a map does.", "Map layers, notification channels or filter chips where any mix is on."],
    instead: [
      "Switching views of the same data, a sort order or a time window: `segmented-control`.",
      "One on/off: `toggle`.",
      "A form choice saved on submit: `radio-group` or `checkbox`.",
    ],
    notes: [
      "Single mode allows clearing the value; guard against an empty value if one is required.",
      "Use joined={false} for filter chips that read as separate options.",
    ],
  },
  "choice-field": {
    use: ["Filters with counts.", "Settings that switch on and off.", "Several answers to one question in a form."],
    instead: ["A single control with a label and nothing else: `label` next to it.", "Picking one of many: `select`."],
  },
  "metric-card": {
    use: [
      "The row of numbers under a dashboard's page header: robots online, events, devices, API calls.",
      "A count that opens the list behind it (with `href`).",
      "A count that needs attention, such as items waiting for review (with `tone`).",
    ],
    instead: [
      "A level in a known range (battery, storage, signal): `meter`.",
      "A number with a chart under it: a `card` with CardDataHeader and CardFigure.",
      "Several values about one thing (a robot's facts): `description-list`.",
    ],
    notes: [
      "Set `trend` from whether the change is good for the reader, not from its sign; only \"bad\" is coloured.",
      "`tone` colours the caption (glyph and words) and needs one that says why; never colour the value or the card yourself.",
      "Pass `unavailable` with the reason instead of value 0 when the source is down or the count is unknown.",
      "`labels` translates the words only screen readers hear (better, worse, loading, unavailable).",
    ],
  },
  meter: {
    use: ["Battery, storage, signal strength, CPU.", "Inline in a table cell, or above a value in a card."],
    instead: ["Work that is under way and will finish: `progress`."],
    notes: [
      "Do not pass a tone: colour comes from `low` and `critical`.",
      "For values where higher is worse, set higherIsWorse.",
      "Numbers are grouped (412,345) through formatNumber, in English without `locale`; pass `locale` for another language and `format` for a short form such as 412K. `aria-valuenow` stays the raw number.",
    ],
  },
  "description-list": {
    use: ["A robot's site, firmware and last contact.", "A dataset's owner, size and date.", "A device's instance ID (mono, copy), version and the caveat on where it came from (hint)."],
    instead: ["Many records to compare: `table`.", "One headline number: a stat in a `card`.", "What a device claims about itself beside the record: `evidence-panel`."],
  },
  breadcrumb: {
    use: ["Pages two or more levels deep: a dataset inside a catalog, a robot inside a site."],
    instead: ["Moving between sections at one level: `tabs`.", "Top-level navigation: the app shell's sidebar."],
  },
  pagination: {
    use: ["Tables and lists with more rows than fit."],
    instead: ["A short list: show it all.", "Finding one record: `command` or a search field."],
    notes: ["Pages are zero-based in code, one-based on screen.", "Pass `labels` to translate every word, the landmark's name (`nav`) included; `paginationLabels` in labels-zh-tw has them all."],
  },
  "copy-button": {
    use: ["IDs, references, install commands, coordinates."],
    instead: ["Sharing a link to the current page: the browser already does it."],
  },
  code: {
    use: [
      "\"Set max_items in the config\": a key or a file in help text and descriptions.",
      "A reference such as group/name@v3 in a table cell or a caption.",
      "A short command inside a sentence.",
    ],
    instead: ["Code or a command on its own lines, with copy: `code-block`.", "A key to press: `kbd`.", "A value to copy: `copy-button` beside the Code."],
    notes: ["Never set a font size or em value on it; it inherits the text's size.", "It has no copy prop: put a CopyButton beside it, never inside."],
  },
  "code-block": {
    use: [
      "Install and import commands (dvc import, npx shadcn add) and curl examples.",
      "A one-time API key or webhook secret, hidden until shown.",
      "Source and API responses in docs and settings pages.",
    ],
    instead: ["A short value inline (an ID, a reference): `code`, with `copy-button` beside it.", "A value someone edits: `input` or `textarea`."],
    notes: [
      "It has no highlighter: pass shiki's `<pre>` as children (the docs site does, in site/code-block.tsx); `code` stays the plain text that Copy copies.",
      "Call shiki with `tabindex: false`, or its `<pre>` adds a second Tab stop.",
      "Highlighted shell commands wrap by words only if each name is marked nowrap in the HTML; the docs site's CodeBlock shows how.",
    ],
  },
  button: {
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
    notes: [
      "Variants: primary (one per screen), secondary, outline, ghost, destructive (danger outline, never a solid red fill), link.",
      "Sizes sm (36 px, mouse only; 44 on touch), md (44), lg (48), icon, icon-sm. Icons inside size themselves; pass none.",
      "`loading` shows a spinner only after 300 ms and keeps the button's width.",
    ],
  },
  "segmented-control": {
    use: ["Map / list, chart / table, day / week.", "A filter with a few exclusive options in a toolbar."],
    instead: ["Sections of a page with different content: `tabs`.", "More than four options: `select`.", "A choice inside a form: `radio-group`."],
  },
  toggle: {
    use: ["Showing or hiding a layer, a column or a panel.", "Toolbar options like bold or follow robot."],
    instead: ["A setting that applies immediately and persists: `switch`.", "One choice among several: `segmented-control`."],
  },
  input: {
    use: ["Names, IDs, addresses, short free text.", "Inside a `field` for its label, hint and error."],
    instead: ["A number with a range or unit: `number-field`.", "An icon, unit or button inside the edge: `input-group`.", "Several lines: `textarea`."],
  },
  "input-group": {
    use: ["Search fields with an icon and a clear button.", "Values with a unit (m/s, %).", "Passwords with show / hide."],
    instead: ["A number you step through: `number-field`, which is built on it."],
    notes: [
      "Put addons inside the group as InputGroupAddon / InputGroupButton; the group draws the edge, focus and error, the Input inside draws nothing.",
      "A search field is an InputGroup with a Search icon addon. Never position an icon absolutely over an Input.",
    ],
  },
  "number-field": {
    use: ["Speed limits, battery thresholds, intervals, counts.", "Any value with limits the user should not exceed."],
    instead: ["A rough value where precision does not matter: `slider`.", "A number with no range, like an ID: `input` with inputMode numeric."],
    notes: [
      "`onValueChange` receives null when the field is cleared; type a controlled value as number | null.",
      "The value is kept in range on blur, never while typing. The − and + buttons are out of the Tab order; arrow keys do the same.",
    ],
  },
  textarea: {
    use: ["Notes, descriptions, incident reports."],
    instead: ["One line of text: `input`."],
  },
  label: {
    use: ["Beside a checkbox, radio or switch to make the whole row tappable.", "Any control not wrapped in a `field`."],
    instead: ["A label with a hint and an error: `field`, which includes it."],
  },
  form: {
    use: ["Create and edit forms: a mission, a robot, a site, an account.", "Any form validated by a schema (zod, valibot) through a resolver."],
    instead: ["Filters above a list, which apply as you choose: `filter-form`.", "One field on its own with no submit (a search box): `search-field`."],
    notes: [
      "Installing the example brings react-hook-form, zod and @hookform/resolvers into your project; nothing else in the kit needs them. Another form library works the same way: put its error in Field's `error`.",
      "Map `field` to each control: spread it on an Input or Textarea; `value` / `onValueChange` and `ref` on the trigger for a Select; `checked` / `onCheckedChange` for a checkbox or switch.",
    ],
  },
  field: {
    use: ["Every form control that needs a label, help or validation.", "Errors that grow in below the control without moving the layout."],
    instead: ["A group of checkboxes or radios under one question: a fieldset with a legend."],
    notes: [
      "Exactly one child control. A Select works too: its trigger reads the Field through useField.",
      "Never add a second error paragraph under it.",
    ],
  },
  checkbox: {
    use: ["Agreeing to terms.", "Choosing several items from a list.", "Select all, with the partly-checked state."],
    instead: ["A setting that applies immediately: `switch`.", "Exactly one of several options: `radio-group`."],
    notes: ["ChoiceField pairs it with its label for you."],
  },
  "radio-group": {
    use: ["Two to five options the user should compare, like a patrol mode."],
    instead: ["A long list: `select`.", "Switching views in a toolbar: `segmented-control`.", "Yes / no: `switch` or `checkbox`."],
  },
  switch: {
    use: ["Notifications on, auto-dock on low battery, dark mode."],
    instead: ["A choice that is saved with a form: `checkbox`.", "Showing a layer or panel: `toggle`."],
    notes: [
      "A switch applies at once: no Save button for it. Confirm with a toast if the change matters.",
      'In a list of settings, render it through ChoiceField with controlAt="end".',
    ],
  },
  select: {
    use: ["Six or more options, or options with long names.", "A compact choice in a table row or a toolbar."],
    instead: ["Two to five options worth seeing at once: `radio-group`.", "A long list the user needs to search: `autocomplete`."],
    notes: ["Inside a Field the trigger is labelled and described automatically; outside one, give the trigger an aria-label."],
  },
  slider: {
    use: ["Volume, brightness, a rough range like a time window.", "Always with the current value shown beside it."],
    instead: ["An exact value or a value with a unit: `number-field`."],
  },
  badge: {
    use: [
      "A release channel or a version after a name: Beta, v2.4.1.",
      "The environment in a header, as a neutral outline: Production, Staging.",
      "A category that does not change while you look at it: a licence tier (T1), a data use (Internal only).",
      "A count next to a title (3 alarms): CountBadge.",
    ],
    instead: [
      "A state that changes (Offline, Patrolling, Low battery, Updating), in a row or beside a page title: `status-eyebrow` (InlineStatus), its shape and word with no box.",
      "A value in a table column whose header already names it: plain text.",
      "A dataset's licence tier: `tier-badge`.",
      "A message that needs a sentence: `alert`.",
    ],
    // CountBadge, in the same file, is the one way to draw a count next to a label.
    notes: [
      "Neutral (the default) or outline only: the tinted tones were removed in 0.40. A state (Low battery) is an InlineStatus, never a badge.",
      "At most one status beside a title, then its badges.",
      "For counts use CountBadge, never a Badge with a number and never a solid red circle.",
    ],
  },
  "tier-badge": {
    use: ["The Tier column of a data catalog, compact.", "Beside a dataset's name on its page, with the words.", "A release check that lists what each dataset may be used for."],
    instead: ["A dataset's state (blocks release, held back): `status-eyebrow` (InlineStatus).", "Any other category: `badge` with tone neutral or outline."],
    notes: ["The tiers and their words are fixed (`Tier`, `tiers`); `labels` changes only the words."],
  },
  card: {
    use: ["A robot's summary, a KPI, a settings section.", "A catalog tile with a cover picture (CardMedia).", "A gallery of collections as media cards: a cover or a mosaic, the title as its one link, facts and a badge (see the examples)."],
    instead: [
      "Rows of similar items: `list` or `table` inside one card. Cards are never nested.",
      "Label and value pairs: `description-list`.",
      "A section title inside the card: `section-header` with `variant=\"surface\"`.",
      "A small picture at the start of a row: `thumbnail`, or `item` with ItemMedia `variant=\"image\"`.",
      "Many pictures, picked or opened: `image-grid`.",
    ],
  },
  avatar: {
    use: ["The signed-in user, an assignee, an author in a log.", "A robot or site next to its name in a list.", "Who is on shift, or which robots share a route, as a group."],
    instead: ["A robot's live state in a table: `status-glyph` and `inline-status`, not a badge on an avatar.", "A large icon in a coloured tile: `icon-tile`."],
  },
  separator: {
    use: ["Between sections of a menu, a card or a toolbar."],
    instead: ["Rows of a list: `list`, which draws inset dividers itself.", "Space alone, when the groups are already clear."],
  },
  progress: {
    use: ["Uploads, map processing, a mission's completion."],
    instead: ["Waiting with no measurable progress: `spinner`.", "Content still loading: `skeleton`.", "A level that is not work, like battery: `meter`."],
  },
  spinner: {
    use: ["Inside a button while its action runs.", "A short wait for a response."],
    instead: ["Progress you can measure: `progress`.", "A page or list still loading: `skeleton`."],
  },
  "empty-state": {
    use: ["A list with no items yet, search with no results, a page without permission."],
    instead: ["A temporary error inside a page: `alert`."],
  },
  "scope-picker": {
    use: ["An API key's or a service account's scopes.", "Any grant of permission strings that must stay within what the person granting holds."],
    instead: ["A role with its bundle: a Select of roles, as users-roles does.", "A few unrelated options: `choice-field` in a FieldSet."],
    notes: ["`groupScopes` gives the same grouping for a read-only list of a key's scopes."],
  },
  "quota-field": {
    use: ["A project's device seats, a plan's seat count, any limit that may be unlimited."],
    instead: ["A number that is never unlimited: `number-field`.", "A choice of a set, not a count: `all-or-some-field`."],
  },
  "all-or-some-field": {
    use: ["A project's licensed modules, a key's projects, any entitlement that may follow the catalog as it grows."],
    instead: ["Permission strings bounded by the viewer: `scope-picker`.", "A fixed set with no \"all\": checkboxes in a FieldSet."],
  },
  "project-switcher": {
    use: ["The sidebar's header in a multi-project console: which project the pages show."],
    instead: ["Switching sites or robots inside one project: the sidebar's own switcher menu.", "Searching everything in the product: the command palette (`command`)."],
    notes: ["Below 640 px it opens as a bottom sheet; the same keys work in both."],
  },
  "freshness-stamp": {
    use: [
      "Beside a device's reported values on its detail page: modules running, GPU, disk.",
      "In a fleet list's last-seen column, with one `now` for every row.",
    ],
    instead: [
      "Live telemetry that streams (a camera, a chart): their own `staleAfterMs`.",
      "Whether the device is online at all: its liveness as an InlineStatus beside its name.",
      "A failed refresh of data the server holds: `data-state` stale.",
    ],
    notes: [
      "`freshnessOf` decides without rendering, for a sort or a filter (\"stale devices\"); the component calls the same function.",
      "Without `now` it reads the clock every 30 s and renders nothing time-based until the page hydrates.",
    ],
  },
  "evidence-panel": {
    use: ["Reviewing a device that asked to join: its key fingerprint, hardware anchors, version and source IP.", "A device's detail page, beside the record, for the hardware it claims."],
    instead: ["Values the server recorded or verified: `description-list`.", "Two versions of one text: `text-diff`."],
    notes: [
      "A list value (GPU UUIDs) is compared as a set, in any order. Pass `matches` for another rule, such as case-insensitive.",
      "Its rows are a table to screen readers, with the column headers present at every width; on a phone each value carries its source in words.",
    ],
  },
  "desired-state": {
    use: ["A revocation, a removal or a licence change waiting for the device's next check-in.", "Any order a device confirms later: a config push, a module switched off."],
    instead: ["A change that applies at once: a toast saying it is done.", "A bounded process with progress: `progress`."],
    notes: [
      "`desiredPhaseOf` gives the phase alone, for a list's state column.",
      "With `thresholds` and `lastCheckInAt` it shows the last check-in's freshness, and a device past the stale threshold blocks the order.",
    ],
  },
  "data-state": {
    use: [
      "A card, table or panel filled from a server: devices, API keys, members, a usage chart.",
      "A list whose refresh can fail while the last page is still worth reading (stale).",
      "A region the viewer may not read inside a page they may open (forbidden).",
    ],
    instead: [
      "A whole page that cannot open: the status-pages block (not found, no access, error, offline).",
      "A condition on the page that is not about loading, true for a while: `alert` or `banner`.",
      "An empty place with no fetch behind it: `empty-state` on its own.",
    ],
    notes: [
      "Map a data layer in one line: `state={dataStateOf({ loading: isPending, error, hasData: !!data, empty: data?.total === 0, forbidden: !can(\"devices:read\") })}`.",
      "Pass the API envelope's `error` object as it is; only `code` is read. Codes without copy fall back to `errorBody` and show the code.",
      "Its live region is present from the first render and reads each new state once; loading is read by the spinner line.",
    ],
  },
  "permission-gate": {
    use: [
      "A write action on a page every member can open: Add device, Remove device, Rotate key.",
      "A settings form members may read and only admins may change.",
      "A section inside a page that needs a further permission (the audit log).",
    ],
    instead: [
      "A whole page the viewer may not open: `NoAccessPage` from status-pages.",
      "A record in another tenant or one that does not exist: a not-found page, never forbidden.",
      "A control off for a reason other than permission (nothing selected, a robot offline): plain `disabled`, with the reason in the interface.",
    ],
    notes: [
      "`permissionsFrom(session.permissions)` turns the list the server sends into `can`; with CASL, pass `(p) => ability.can(...)` instead.",
      "In `disabled` mode the child must be one control that takes `onClick`, `className` and `aria-*` (Button, a link, a menu item): its click is refused, and `aria-disabled` keeps it in the Tab order.",
      "`isAllowed` is the same decision without rendering, for a menu built from data.",
    ],
  },
  "step-up-dialog": {
    use: [
      "Revoking an API key or a device, rotating a webhook secret, removing a member, deleting a project.",
      "Any action the server guards with a fresh check (sudo mode).",
    ],
    instead: [
      "Confirming a consequence, with no identity check: `alert-dialog`.",
      "Signing in, or the second step of a sign-in: the auth-2fa block.",
    ],
    notes: [
      "Usually spread from useStepUp: `<StepUpDialog {...stepUp.dialog} />`. On its own, pass `open`, `verify`, `onVerified` and `onCancel`.",
      "Focus opens in the field and returns to the control that started the action; a failure is read out (role alert) and the field is cleared.",
      "Passkeys and other proofs belong in your `verify`; the dialog takes a code or a password.",
    ],
  },
  table: {
    use: ["Fleet lists, event logs, user lists on wide screens."],
    instead: ["The same rows on desks and on phones: `responsive-table`, a table that becomes a grouped list.", "Phones, or records with one main line: `list`.", "A trend over time: `chart`."],
    notes: ["Sortable column: pass `sort` and `onSort` to TableHead; do not build your own header button."],
  },
  "responsive-table": {
    use: ["A robot, incident or user list a page shows on desks and phones.", "A table in a dashboard column that can be narrow."],
    instead: ["Many columns to sort, filter and select: `data-grid`.", "Rows only ever on a phone or in a side panel: `list`.", "Rows that only show on wide screens: `table`."],
    notes: [
      "Write each column once, with `phone` saying where it goes; never a second hand-written phone list beside a Table hidden with `sm:hidden`.",
      "Keep the phone row to its title, one trailing state and one or two facts; mark the rest `hidden`.",
      "Pass `layout=\"list\"` or `\"table\"` only where the width never changes (a side panel); `auto` measures.",
    ],
  },
  list: {
    use: ["Robots, missions or settings on phones and in side panels."],
    instead: ["Many columns to compare: `table`.", "The same rows as a table on wide screens: `responsive-table`."],
  },
  "status-glyph": {
    use: ["Next to a robot's name, in tables and on the map."],
    instead: ["A state with its word: `status-eyebrow`.", "An alarm: `alarm`, which has its own shapes."],
    notes: [
      "Active and normal render in the foreground colour, not blue or green.",
      "`status=\"none\"` takes `GlyphStatus`; `Status` keeps its five values, so a `Record<Status, string>` of words needs no new key.",
    ],
  },
  "status-eyebrow": {
    use: [
      "InlineStatus: a row's state in a list or a table cell (Patrolling, Offline, Needs review).",
      "InlineStatus: the one state beside a page title, in PageHeader's `status`.",
      "StatusEyebrow: a robot's page title, Patrolling above Patrol dog 7F3A.",
    ],
    instead: ["A fixed attribute or category (Beta, a version, Production): `badge`.", "A count: CountBadge in `badge`.", "The shape alone, with the word elsewhere: `status-glyph`."],
    notes: ["Both come with `npx shadcn add @syncrobotic/status-eyebrow`: there is no separate inline-status item.", "In a 12 px meta line, give InlineStatus `className=\"text-xs\"` so the line keeps one size."],
  },
  skeleton: {
    use: ["A page or card whose data is loading."],
    instead: ["An action in progress: `spinner` in its button."],
  },
  alarm: {
    use: ["Anything a person must act on: collision risk, e-stop, low battery on a mission."],
    instead: ["Feedback on what the user just did: `toast`.", "A note about the page that needs no action: `alert`."],
    notes: [
      "Alarms are for what a person must act on, by ISA-18.2 priority (critical, high, low). Never show them as toasts.",
      "AlarmList sorts and announces new alarms itself; give it the data and onAcknowledge, and `acknowledgedAt` once acknowledged so the row says when.",
      "“Acknowledge all” appears only with `onAcknowledgeAll`, which receives the ids in view: never critical (acknowledged row by row), shelved, suppressed or out-of-service ones.",
    ],
  },
  alert: {
    use: ["A form that cannot be saved, a robot that is offline, a setting that has a consequence."],
    instead: ["Something a person must act on now: `alarm`.", "Feedback that goes away by itself: `toast`."],
    notes: ["An alert stays while its condition holds; it has no close button."],
  },
  banner: {
    use: [
      "Scheduled or running maintenance, read-only mode, a trial or licence about to end, no connection to the server.",
      "Anything every page of the app is affected by, shown once at the top instead of on each page.",
    ],
    instead: [
      "A condition of one page, form or record, inside the content (a robot that is offline, a form that cannot be saved): `alert`. An Alert sits in the flow with rounded corners beside what it is about; a banner spans the app edge to edge and is about the app.",
      "The result of what someone just did, or a minor event that passes: `toast` (the control app: the island's notices). A toast goes away by itself; a banner stays until its condition ends.",
      "Something an operator must act on at a robot: `alarm`.",
    ],
    notes: [
      "Keep `open` and the dismissal in your app (onDismiss stores it, keyed to that notice); the banner does not remember. Omit onDismiss for conditions that end by themselves.",
      "Above AppShell, the shell must shrink by the banner's height: wrap the shell in `min-h-0 flex-1 [--app-shell-height:100%]` inside a `flex h-dvh flex-col` with the banner first. Full-screen blocks (sign-in, status pages) honour the same variable.",
      "After a dismiss the close button is gone: move focus to the main content in onDismiss if focus was on it.",
    ],
  },
  toast: {
    use: ["Saved, copied, mission started, with Undo where possible."],
    instead: ["Anything that needs a person to act: `alarm`, never a toast.", "A state of the page: `alert`."],
    notes: [
      "Only feedback on the user's own action. Anything needing action is an Alarm.",
      "A second Toaster (a block that brings its own) draws nothing while the first is mounted.",
    ],
  },
  tabs: {
    use: ["A robot's Overview, Sensors and Logs.", "A long detail page (a dataset's Overview, Browse and Versions) with `sticky`, so the row stays under the top bar."],
    instead: ["Two to four views of the same data: `segmented-control`.", "Sections the user may want open together: `accordion`."],
    notes: [
      "`<TabsList sticky>` pins at `top: var(--shell-top, 0)` on `var(--shell-surface)`, under the bar. The shells set both; outside a shell set them yourself on an ancestor.",
    ],
  },
  tree: {
    use: [
      "Data lineage: a release, the label sets it was trained on, and their sources.",
      "Sites › zones › robots, to read or to pick one.",
      "The folders and files of a dataset, as a file explorer.",
    ],
    instead: [
      "One level of rows: `list`.",
      "Where this page sits among its parents: `breadcrumb`.",
      "Sections of one page that open and close: `accordion`.",
      "Rows with columns to compare: `data-grid` with expanding rows.",
      "Nodes with several parents (one source under two label sets, steps that run in parallel and meet): `graph`.",
    ],
    notes: [
      "Do not use select mode for a tree of links: role=\"tree\" takes the arrow keys and makes the whole tree one Tab stop, so links inside it are not followed by Enter. Use list mode, which keeps links as links.",
      "Each node's id must be unique across the tree, even when the same thing appears twice (a source under two label sets): give the repeat its own id and a marker in meta.",
      "Pass `labels.toggle` and `empty` to translate the disclosure buttons' names and the empty text.",
    ],
  },
  accordion: {
    use: ["Long settings, FAQs, details the user rarely needs."],
    instead: ["Sections that are each a full view: `tabs`.", "One region behind one trigger, with no heading: `collapsible`."],
  },
  collapsible: {
    use: ["\"More filters\" under a filter bar.", "\"How to use this\" on a card.", "The rest of a long note."],
    instead: ["A set of sections with headings: `accordion`.", "A hierarchy that opens level by level: `tree`.", "Details over the page: `popover` or `sheet`."],
    notes: [
      "Never a native <details> or your own chevron: this keeps the kit's chevron, focus ring and motion.",
      "Do not wrap the trigger in a heading; if the region needs one, it is an accordion section.",
      "Put layout (gap, padding) on CollapsibleContent's className; it goes on the inner box, so the height animation stays clean.",
    ],
  },
  "heartbeat-strip": {
    use: ["On a device's detail page, the last hour, day or week of check-ins.", "Reading a gap against a restart or an update on the same axis."],
    instead: ["Uptime per day for several machines: the status-tracker-uptime pattern.", "A measured value over time (cameras, load): `chart`."],
    notes: [
      "`heartbeatCell` and `heartbeatGaps` give the same verdicts without rendering, for a summary elsewhere.",
      "The strip is one Tab stop; its numbers are in words above it, and the table view lists every stretch.",
    ],
  },
  dialog: {
    use: ["Rename, a short form, a choice with two or three outcomes."],
    instead: ["Confirming something that cannot be undone: `alert-dialog`.", "Longer content, or on phones: `sheet`."],
    notes: ["Short decisions only; on phones or for long content use Sheet.", "Always a DialogTitle; DialogDescription when there is anything to explain."],
  },
  "alert-dialog": {
    use: ["Delete a route, stop all robots, revoke access."],
    instead: ["A reversible action: do it, and offer Undo in a `toast`."],
    notes: ['The confirm button names the consequence ("Delete route"), never "OK". Cancel has focus first.'],
  },
  sheet: {
    use: ["Filters, a record's details next to a list, longer forms on phones."],
    instead: ["A short decision on desktop: `dialog`."],
  },
  popover: {
    use: ["A date picker, a short form, an explanation with a link."],
    instead: ["A name for an icon button: `tooltip`.", "A list of actions: `dropdown-menu`."],
  },
  "hover-card": {
    use: ["Robot, site or dataset IDs in tables, event logs and text, where a glance saves opening the page."],
    instead: [
      "Anything someone needs, or anything to click: it is not on touch screens and screen readers are not told about it. Put it on the page, or in a `popover` opened by a click.",
      "The name of an icon button: `tooltip`.",
    ],
    notes: ["The trigger is always a real link (asChild on an `a` or your router's Link) to a page that has everything the card shows."],
  },
  tooltip: {
    use: ["Every icon button without a visible label."],
    instead: ["Anything needed on touch screens, where tooltips never show: a visible label, or `popover`."],
  },
  chart: {
    use: ["Trends over time, comparisons between a few series."],
    instead: ["A single number: a stat in a `card`.", "Exact values to read or export: `table` (`ChartTable`).", "A sparkline in a row, a status strip, a ring or a heatmap, with no chart library: the `/blocks/data-visualisation` blocks."],
    notes: ["Spread `chartMotion` onto marks; do not set Recharts animation timing."],
  },
  "streaming-chart": {
    use: [
      "Motor currents, speed, a temperature or a battery's voltage on a robot's page while it works or is commissioned.",
      "Watching a value against its limit as it happens: a motor heating up, a pack sagging under load.",
      "Any ROS topic of numbers (std_msgs/Float64, a field of sensor_msgs/BatteryState or JointState), pushed as it arrives.",
    ],
    instead: [
      "A history read afterwards (a shift, a week, a mission): `chart`, with its table.",
      "One value now: a `metric-card`, or a `meter` for a level within a range.",
      "A value that needs someone to act when it crosses a limit: raise an `alarm`; the chart shows the trend, the alarm asks for the action.",
    ],
    notes: [
      "Never put readings in props or state: push them (`ref.current.push(values, time)`, or `subscribe={(push) => source.on(push)}` returning the cleanup). A `useRosTopic` value would render the page for every message; `ros.subscribe` in `subscribe` does not.",
      "Keep `subscribe` stable (module level, or memoised by the React Compiler or useCallback): the chart reconnects when it changes.",
      "`push` takes one reading per series key; a key left out has no reading this time, so series at different rates share a chart. null or NaN is a gap. A reading older than the series' newest is dropped.",
      "The time axis follows the readings' clock, carried forward by the browser's: pass the message's stamp in ms when there is one, or leave it out for now.",
      "Every word is in `labels`, including `formatTime`, the axis' `secondsAgo` and `minutesAgo`, `withUnit` and `reading` (what screen readers hear); `locale` formats the numbers and times. Pass the app's locale.",
    ],
  },
  attitude: {
    use: [
      "A legged or tracked robot on rough ground or a slope: how far it leans, against its tip-over limit.",
      "An AMR on a ramp or a dock plate: pitch and roll while it climbs.",
      "A robot's speed, a motor's temperature or a wheel's current at a glance, beside the drive controls or on a robot's page.",
    ],
    instead: [
      "A level that stays (battery, storage, signal): `meter`, a bar, which reads faster in a list.",
      "How a value moved over the last minutes: `streaming-chart`.",
      "A limit crossed that needs someone to act: raise an `alarm` too; the instrument shows where, the alarm asks for the action.",
      "A pose on a map: `robot-map`; the arm's joints: `joint-state`.",
    ],
    notes: [
      "Plain props for a fixed reading; for a stream, `push` on the ref or `subscribe={(push) => ros.subscribe(\"/imu/data\", \"sensor_msgs/Imu\", (m) => push(imuToAttitude(m), stampToMs(m.header?.stamp)))}`. A reading moves the drawing on the next frame without a React render; the numbers render at most four times a second, and at once when a limit is crossed.",
      "Degrees, REP 103 signs: positive roll is the right side down, positive pitch the nose down; `heading` is clockwise from north (`imuToAttitude` gives 90 − yaw, the IMU's orientation being east-north-up). Direction is always said in words, so the sign never has to be read.",
      "`limits.roll` and `limits.pitch` take `warning` and `critical`, the same either side of level. Gauge takes Meter's `low`, `critical` and `higherIsWorse` and reads them with Meter's own functions (`meterTone`, `meterSaid`), so a 74 °C motor is \"High\" on both.",
      "Stale is timed by when this browser received the reading, never by the stamp; the stamp is the time Stale shows. On by default (1 s for the attitude, 3 s for a gauge); `staleAfterMs={null}` never goes stale.",
      'The attitude is a role=img named by the whole reading in words, with readouts as text beside it; Gauge is a role=meter with `aria-valuetext` ("73.8 °C, high"). A crossed limit is announced politely at most every `announceEveryMs` (5 s), at once when critical; one already crossed when data arrives is not.',
      "Every word is in `labels` (`attitudeIndicatorLabels`, `gaugeLabels` in `labels-zh-tw`), including the compass points and `summary`, what screen readers hear; `locale` formats the numbers and the time.",
    ],
  },
  command: {
    use: ["The app's search for robots, pages and actions (AppShell `search`).", "Picking from a long list by typing."],
    instead: ["Filtering a list on the page as you type: `input-group` with a search icon.", "A few options: `select`."],
    notes: [
      "In an app, pass AppShell `search` (groups with scope); it wires the field, the scope and ⌘K / Ctrl+K.",
      "Group results by kind; give robots a `tone` so their state shows its shape.",
    ],
  },
  "dropdown-menu": {
    use: ["Row actions in a table, the user menu, overflow (⋯) buttons."],
    instead: ["Picking a value: `select`.", "One obvious action: a `button`."],
  },
  "context-menu": {
    use: ["Rows of a robot or mission list, cards, nodes on a map or a tree: the same actions as the row's ⋯ menu, where people expect a right-click."],
    instead: [
      "The only way to an action: never. Add a ⋯ button with a `dropdown-menu` (same items), a toolbar button, or put it on the detail page.",
      "One obvious action on the item: a `button` on it.",
    ],
    notes: [
      "Render the same items into both menus from one list, so the ⋯ menu and the context menu cannot drift apart.",
      "Shift+F10 and the Menu key open it from the keyboard when focus is inside the trigger: put the trigger on a row that holds a link or a button, or make the area focusable.",
    ],
  },
  "stop-button": {
    use: ["Every screen that controls a robot, always in the same place."],
    instead: ["Any other destructive action: `button` with the destructive variant. Solid red belongs to the stop alone."],
    notes: [
      "UI only. Send the stop command, wait for the dog, fall back to Bluetooth after 1.5 s in the app, and pass the result back as `state`.",
      "Its height is --h-stop: 56 px, 64 px in glove density. It never shrinks, compact density included.",
    ],
  },
  "slide-to-release": {
    use: ["Releasing an emergency stop, where a tap would be too easy in a panic."],
    instead: ["Routine confirmations: `alert-dialog`."],
    notes: ["Viewers get `locked`."],
  },
  "teleop-pad": {
    use: [
      "Driving a robot remotely from a phone or a control-room console: out of a corner, onto a dock, past an obstacle.",
      "Short manual moves during commissioning or maintenance.",
    ],
    instead: [
      "Stopping a robot in an emergency: `stop-button`, beside the pad.",
      "Sending a robot somewhere: a mission or a goal on the map, not manual driving.",
      "Setting one speed or value: `slider` or `number-field`.",
    ],
    notes: [
      "Run a watchdog on the robot: stop when no command has arrived for 3 periods (300 ms at 10 Hz). The pad stops on every event it can see, but a frozen tab or a dropped link sends nothing at all.",
      "Map `{ linear, angular }` onto the robot's own limits (a Twist scaled by its top speeds); clamp there too, never trust the client alone.",
      "`timeoutMs` (2 s) also stops a mouse held perfectly still, which sends no events (\"input lost\": press again). Turn it off with `timeoutMs={false}` only when the robot runs the watchdog above.",
      "Pass the measured speed as `speed`, not the commanded one: the status line says what the robot does.",
      "Name the robot in `labels.name` (\"Drive 7F3A\") when the operator can drive more than one.",
    ],
  },
  dock: {
    use: ["Every page of the phone control app."],
    instead: ["Internal tools on desktop: the app shell's sidebar."],
  },
  island: {
    use: ["Every page of the phone control app. The whole app, island, page and dock with the stop, is the `app-shell-control` block."],
    instead: [
      "Internal tools and the fleet console: the app shell's top bar (on a phone, `app-shell-mobile-tabs`). The island is for the person controlling one robot; a fleet has no single name, status or battery to put in it.",
    ],
    notes: [
      "Each zone opens its panel: pass `panels={{ name: <IslandRobots />, status: <IslandStatus />, bell: <IslandNotifications /> }}`. Leave `open` out and the island keeps it itself; pass `open` and `onOpenChange` to close it from outside (after a robot is chosen, say).",
      "Pair with `edge={alarmEdge(topAlarm(alarms)) ?? stateEdge}`, where stateEdge is the persistent fault (stopped: danger; offline stays neutral), so a low alarm does not erase it. Put IslandAlarm inside, from the same alarm data as AlarmList."],
  },
  tray: {
    use: [
      "A floating panel of your own over a map or a full-screen view, so it looks like the island and the dock: same corners, padding, surface and shadow.",
      "You rarely use it directly: `island` and `dock` already wrap it.",
    ],
    instead: ["A panel in the page's flow: `card`.", "The robot's status bar at the top: `island`.", "A row of tools at the bottom: `dock`."],
  },
  "use-long-press": {
    use: ["Hold-to-confirm actions, like stop all."],
    instead: ["A plain click: `button`."],
  },
  "use-debounce": {
    use: ["A search sent to a server when the typing stops (autocomplete's `debounce` uses it).", "Autosave after edits pause."],
    instead: ["Something the person must see at once: update it directly, never debounced."],
  },
  "format-number": {
    use: [
      "A count in a table, a header, a detail page or a figure: `formatCount(n, { locale })`.",
      "A count on a tab, a chart's ticks or a compact chip: `formatCount(n, { compact: true })`, with the full number one step away.",
      "A reading, a share, a price: `formatNumber(n, { locale, maximumFractionDigits: 1 })` (any Intl.NumberFormat option).",
    ],
    instead: ["A time of day: `clock-time`.", "A number typed in: `number-field`."],
    notes: [
      "Never `toLocaleString()` or a hand-made \"k\": the first follows the runtime's language, so the server and the browser write different digits.",
      "`resolveLocale(locale)` is the tag both use: English without one and for a tag Intl cannot read; `numberFormat(locale, options)` is the cached formatter for a hot loop.",
    ],
  },
  "clock-time": {
    use: ["A last-update time beside live data: Stale since 14:02:31.", "A log or an event's time of day."],
    instead: ["\"12 s ago\": count from `use-now`'s clock.", "A date: the date components (`calendar`, `date-selector`)."],
  },
  feedback: {
    use: ["A safety moment your app sees and the kit does not: the robot confirmed the stop.", "Turning sound or vibration off in a setting: `configureFeedback`."],
    instead: ["A confirmation on screen: `toast`.", "Something someone must act on: `alarm`."],
    notes: ["Never `navigator.vibrate` directly. iOS has no vibration and sound needs a first tap, so it never replaces the screen."],
  },
  "list-query": {
    use: [
      "Every list the server pages: devices, members, audit events, webhook deliveries.",
      "Reading a list's query in a server component, so the first HTML shows the right page.",
      "Building the request: `serializeListQuery(query, { complete: true })`.",
    ],
    instead: ["A short list the page holds whole (under a few hundred rows): filter it in the browser with `filters`."],
    notes: [
      "Rename URL keys with `keys` (`{ search: \"q\" }`) when a product's links already use other names; the fields keep theirs.",
      "`clampPage` moves a query past the last page back onto it, after rows are deleted or from an old link.",
    ],
  },
  "use-list-query": {
    use: ["A list page whose filtered view should be a link people can share.", "Back and forward that restore the search, sort and page."],
    instead: ["The grammar alone, with no React (a server component, a request): `list-query`.", "A list inside a dialog: pass `memoryAdapter()`, so the page's URL is left alone."],
    notes: [
      "`param` and `setParam` keep other keys (a status filter, a tab) beside the query.",
      "An adapter is `read`, `write`, and `subscribe` when the router does not re-render by itself; `readOnServer` is what the server rendered.",
    ],
  },
  "use-step-up": {
    use: ["Every call the server may refuse with ELEVATED_SESSION_REQUIRED or TWO_FACTOR_SETUP_REQUIRED."],
    instead: ["A confirmation with no identity check: `alert-dialog`."],
    notes: [
      "`errorCodeOf` finds the code on the error, in its `error`, `body`, `details` or `data`, the shapes fetch wrappers give.",
      "A second call that asks while one waits cancels the first, so only one dialog is ever open.",
    ],
  },
  "relative-time": {
    use: ["\"Reported 3 minutes ago\", \"ordered 2 days ago\", a log's time column, an axis's ticks.", "The exact time behind a relative one, in a tooltip."],
    instead: ["A time of day on a live panel, to the second: `clock-time`.", "Numbers that are not times: `format-number`."],
    notes: ["English without a locale, so server and browser agree; give `timeZone` when the server formats, as its zone is rarely the reader's."],
  },
  "use-now": {
    use: ["\"Updated 12 s ago\", a timeout, an alarm flood's window.", "Stale data: how long since the last message."],
    instead: ["A time of day to show: format the value with `clock-time`."],
  },
  "use-reduced-motion": {
    use: ["Motion driven from JavaScript: a scroll into view, a canvas camera, a spring.", "Turning off a loop that only decorates."],
    instead: ["CSS animations: the kit's motion tokens already follow `prefers-reduced-motion`."],
  },
  "use-ros": {
    use: [
      "A robot's page or console fed live from its robot: the map, the pose, the scan, the joints.",
      "Driving by hand: `teleop-pad` publishing /cmd_vel.",
      "Calling a robot's services (dock, reset localisation) from a button.",
    ],
    instead: [
      "A fleet seen through your own backend (REST, GraphQL, MQTT): pass the backend's data to the components; this connects a browser to one robot's rosbridge.",
      "The converters alone, outside React (a worker, a server, another bridge): `ros`.",
      "Video: `camera-feed` or `camera-wall` over WebRTC or a stream URL; rosbridge is not for frames. `webVideoServerSrc(server, topic, { quality })` builds the web_video_server URL for an image topic.",
    ],
    notes: [
      "Start rosbridge on the robot with `ros2 launch rosbridge_server rosbridge_websocket_launch.xml` (ROS 1: `roslaunch rosbridge_server rosbridge_websocket.launch`); it listens on ws://<robot>:9090. Use wss:// behind a TLS proxy from an https page: a browser blocks ws:// from https.",
      "Types may be written `geometry_msgs/Twist` (works with ROS 1 and ROS 2) or `geometry_msgs/msg/Twist` (ROS 2 only).",
      "useRosTopic returns the same object until a new message arrives, and every component on a topic shares one wire subscription (the fastest throttle any asks for). Convert in a useMemo keyed on the message.",
      "rosbridge has no watchdog: a frozen tab or a dropped link leaves the robot with the last command it received. The hooks send a zero Twist whenever they can, but the robot must stop by itself when commands stop arriving (a base controller's cmd_vel timeout, twist_mux).",
      "useRosPublisher returns false when a message was dropped: a drive command while the link is down (never held for later), or one after a drop or a hidden page until the app publishes a stop. teleop-pad publishes a stop when the finger lifts, so the operator lets go and presses again.",
      "RosProvider takes `url` (it opens and closes the connection) or `connection` (one the app made with createRosConnection and opens itself, as tests do with a fake WebSocket).",
    ],
  },
  ros: {
    use: [
      "Feeding `robot-map`, `point-cloud`, `joint-state`, `diagnostics`, `attitude` from ROS messages, whatever brought them (rosbridge, Foxglove, a recorded bag, your backend).",
      "A rosbridge connection outside React: a worker that decodes clouds, a test, a script.",
    ],
    instead: ["Connecting React components: `use-ros`, which installs this."],
    notes: [
      "robot-map: `occupancyGridToGrid` (`grid` or `costmap`), `laserScanToScan(msg, robotId)` (`scans`), `poseToRobotMapPose(msg, gridToPlan(grid))` (x, y and heading from Pose, PoseStamped, PoseWithCovarianceStamped or Odometry), `goalToPoseStamped(goal, frame)` (`onGoal` to /goal_pose).",
      "point-cloud: `pointCloud2ToPoints` (`points` and `intensity`). joint-state: `jointStateToJoints(msg, { limits })`. robot-model: its own `jointStateToRecord`.",
      "diagnostics: `diagnosticArrayToStatuses(msg)` and `mergeDiagnostics(previous, next)` (`statuses`). log-viewer: `rosLogToLogLine` (a /rosout line, ROS 1 or 2).",
      "attitude: `imuToAttitude(msg)` (roll, pitch and heading in degrees; `quaternionToEuler` for radians) and `odometryToSpeed(msg)` (Gauge's speed in m/s). teleop-pad: `teleopToTwist(command, { maxLinear, maxAngular })`.",
      "waypoint-editor: `waypointsToPath(waypoints, frame)` and `waypointsToNavigateThroughPoses(waypoints, frame)` (`onSave` to `nav_msgs/Path` or a Nav2 goal; a waypoint without a heading faces the next), and `pathToWaypoints` / `navigateThroughPosesToWaypoints` back to `value`.",
      "annotated-image: `detection2DArrayToAnnotations(msg, { classes })` (a `vision_msgs/Detection2DArray`, which grounded-text links to). Any `updatedAt`: `stampToMs(header.stamp)`.",
      "rosbridge sends `uint8[]` (PointCloud2.data) as base64 and `int8[]` (OccupancyGrid.data) as a list of numbers; the converters read either. NaN and ±Infinity in a LaserScan arrive as null (or as bare tokens, which the client reads as null) and are skipped like out-of-range readings.",
      "A pose must be in the map frame for robot-map (/amcl_pose is; /odom drifts). A scan is drawn from the robot's centre, so transform it to the base frame first if the laser is offset.",
    ],
  },
  "use-hotkeys": {
    use: ["A review or labelling queue answered by keyboard.", "A tool's global shortcuts, like mod+k for search."],
    instead: ["Keys inside one widget (arrows in a list): the widget's own onKeyDown, or the Radix component that has them."],
    notes: [
      "mod is ⌘ on Mac and Ctrl elsewhere. Symbols like ? match whatever Shift it took; letters need the exact modifiers, so mod+z never fires on mod+shift+z.",
      "Held keys do not repeat unless a binding sets repeat: holding 1 answers once.",
      "Returns `pressed`, the binding whose key is down (kept at least 150 ms), for <Kbd pressed>.",
    ],
  },
  "use-slide-release": {
    use: ["Building another slide-to-confirm control."],
    instead: ["Releasing a stop: `slide-to-release`, which uses it."],
  },
}
