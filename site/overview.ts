// What each item is and when to reach for it, shown at the top of its page.
// `use`: the jobs it is for. `instead`: when another item fits better, naming it in backticks.

/** `notes`: what an AI agent (or a new teammate) most often gets wrong with this item. Shown in its markdown twin. */
export type Overview = { what: string; use: string[]; instead?: string[]; notes?: string[] }

export const overviews: Record<string, Overview> = {
  "page-header": {
    what: "The top of a page: where it sits, what it is, the facts that frame it, and its actions.",
    use: ["The first thing in a page's content, under the app's top bar.", "A dataset, robot or site page whose counts and owner matter at a glance."],
    instead: ["A title inside a card: the card's own heading.", "The app's own frame: `app-shell`."],
  },
  "chip-group": {
    what: "One choice among several, shown as chips with their counts, folded after a few.",
    use: ["A quick filter above a list: task, site, tier.", "Saved views as links, so the choice lives in the URL."],
    instead: ["Several choices at once: checkboxes in a `field`.", "Two to four views of the same data: `segmented-control`."],
  },
  "filter-form": {
    what: "Filters kept in the URL: a GET form that applies itself as you type or pick, and works without JavaScript.",
    use: ["A catalog or log whose filtered view should be shareable and survive Back.", "Any page where changing a filter resets the page number."],
    instead: ["Filters on data already in the browser: filter in state, as `data-grid` does."],
  },
  filters: {
    what: "A query people build from chips: pick a field, how to compare it and a value; every rule must match.",
    use: [
      "A long list or grid with many columns worth filtering: robots, incidents, runs.",
      "Views people tune and share: the rules go in the URL.",
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
    ],
  },
  "search-field": {
    what: "The tool's one search box: `/` focuses it, Enter opens the results page, and on that page it follows the URL.",
    use: ["The search in an app's top bar.", "The query box on a results page (`live`)."],
    instead: ["Filtering a list on the page: an `input-group` with a search icon.", "Picking from a known list as you type: `autocomplete`."],
  },
  "theme-toggle": {
    what: "Light, match the system, or dark, as three icon segments.",
    use: ["Settings, or the corner of an app's top bar."],
    instead: ["A single on or off: `switch`."],
  },
  "route-progress": {
    what: "A thin bar at the top while the next page loads, after 300 ms and gone when it arrives.",
    use: ["Page changes in an app that loads data as you navigate."],
    instead: ["Work inside the page: `progress` or a `skeleton`."],
  },
  "share-bar": {
    what: "How a whole splits into a few parts, as one thin bar, light enough for a table cell.",
    use: ["Images by use, label sources, a dataset's tiers.", "Inside a table cell without a legend, or on its own with `legend`."],
    instead: ["Values over time or many categories: `chart`.", "A single level within a range: `meter`."],
  },
  "annotated-image": {
    what: "A picture with boxes, points, polygons or poses drawn over it: what a model predicted, what a person labelled, the previous version.",
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
    ],
  },
  "media-player": {
    what: "A recorded clip with the kit's own controls over a native video: play, a timeline with event markers, time, mute, speed, captions and full screen.",
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
    what: "A robot's live camera over a native video the app feeds, that always says whether the picture is live: Live with the latency, Stalled with the last frame's time, Paused, connecting, offline or no camera.",
    use: [
      "The camera panel of a robot's page or a teleoperation screen.",
      "A wall of a site's cameras, one feed per robot.",
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
    ],
  },
  "joint-state": {
    what: "A robot arm's joints for monitoring: each joint's position in degrees or millimetres on a thin track between its URDF limits, with velocity and effort, and words when a joint is near, at or past a limit.",
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
      "Stale comes from time alone: no new `joints` array (or, when you pass `updatedAt`, no new stamp) for `staleAfterMs`, timed by the browser's clock so a robot's clock that is off does not matter. The values stay, in grey, with the time of the last update, so a frozen arm is never mistaken for a still one.",
      "On a narrow panel (a phone, a side column) each row stacks: name and position, then the track, then velocity and effort with their names. Wide, they line up in columns under one heading row.",
      "Every word is in `labels`, including the units (`degrees`, `millimetres`, …) as functions of the formatted number, and `formatTime`; `locale` formats the numbers and the time.",
    ],
  },
  "restricted-preview": {
    what: "A preview that does not load until someone asks: restricted data, faces, number plates.",
    use: ["Thumbnails of a restricted dataset in a catalog or gallery."],
    instead: ["Data the viewer may not see at all: leave it out and say so in an `empty-state`."],
  },
  "image-grid": {
    what: "Many pictures at once, as a grid or a strip, that open in a lightbox or are picked one or many at a time.",
    use: [
      "A dataset's images, the frames of a run, a camera's snapshots.",
      "Picking a cover picture, or the frames to send for labelling.",
      "What was just uploaded, as a strip under the upload field.",
    ],
    instead: ["Files that are not pictures, or a queue with progress: `attachment`.", "One preview someone must ask to see: `restricted-preview`."],
    notes: [
      "Placeholders and tests must not load external URLs; draw the picture in code (an SVG data URI).",
      "Selection is `aria-pressed` on each tile; do not add a separate checkbox.",
    ],
  },
  "load-more": {
    what: "The end of a long list: how much is shown, and one button for the next batch that says how many remain.",
    use: ["Lists and galleries on a phone.", "Results that load in batches."],
    instead: ["A desktop table people jump around in: `pagination`."],
  },
  "robot-map": {
    what: "A site's floor plan in metres with its zones, routes and robots, panned and zoomed in place, and a list with the same robots as text.",
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
      "Coordinates are metres from the plan's top-left, y down; `heading` is degrees clockwise from the top of the plan (0 up, 90 right), as the plan image is drawn. From a ROS map frame (x right, y up, yaw counter-clockwise from +x, in radians), with the plan's bottom-left at (originX, originY): `x = xRos − originX`, `y = height − (yRos − originY)`, `heading = 90 − yaw × 180 / π`.",
      "`floorplan` is an image URL stretched over `width` × `height`, or SVG drawn in metres (add `vectorEffect=\"non-scaling-stroke\"` to keep hairlines thin when zoomed).",
      "By default the frame keeps the site's proportions (at most 75 % of the screen's height); `fill` makes it fill its parent, for a full-screen map.",
      "`grid` takes a ROS `nav_msgs/OccupancyGrid` as it arrives (`width`, `height`, `resolution`, `origin` from `info`, and `data` as an `Int8Array` or `number[]`, row 0 at the bottom). Free cells are the map's surface, occupied ones a muted grey at their probability (background, never heavier than the robots), unknown ones the theme's no-data hatch; nothing in it is a status colour. With no `width` and `height` the grid is the whole plan (`gridToPlan(grid)` gives its size and origin); under a plan of its own, `origin` says where the plan's bottom-left corner is in the map frame. Convert poses with `rosToPlan(frame, { x, y, yaw })`, the same formula as above.",
      "The grid is drawn into an image once per new `data` array (one pass, encoded off the main thread), so a 4000 × 4000 map pans freely: keep the same array while the cells are unchanged, pass a new one when they change.",
      "`costmap` takes the same message and lays the accent's ramp over the floor, clear at 0 and 60 % at lethal, under the grid's walls, with a legend in words (Cost: low → lethal). Unknown costs are left clear.",
      "`scans` takes ROS `sensor_msgs/LaserScan`s (`angleMin`, `angleIncrement`, `ranges` as a `Float32Array` or `number[]`, `rangeMin`, `rangeMax`), each with the `robotId` it came from, and draws them as small dots from that robot's current x, y and heading: beam i at `heading` turned `angleMin + i × angleIncrement` counter-clockwise. NaN, ±Infinity and readings outside rangeMin–rangeMax are skipped; a robot with no heading draws no scan. The laser is taken to sit at the robot's centre: transform the scan to the base frame first if it does not. `scanToPoints(scan, robot)` gives the same points.",
      "Scan dots are the ink colour by default, darker than the grid's grey walls, so a hit reads against its wall; `scanColor=\"chart-1\"` sets them apart further. One path per scan, so 10 robots × 1080 beams stay smooth.",
      "Editing is controlled, like everything else: `mode` is `view` (the default), `goal`, `waypoints` or `zone`; the map draws the app's `goal`, `waypoints` and `zones` and reports changes through `onGoal`, `onWaypointsChange`, `onZoneDraw` and `onZonesChange` (`editableZones`). It keeps only what is half done (a goal being pointed, a zone's corners before it closes) and drops it when the mode changes. `onZoneDraw` gives the corners only: ask for the name and kind, then add the zone to `zones`.",
      "In an edit mode the primary pointer (left button, one finger, a pen) edits and everything else pans: drag with the right or middle button, or with two fingers (a second finger also cancels what the first had started); the wheel and the buttons still zoom. A drag on the empty map adds nothing; only a click does. One finger no longer scrolls the page over the map while it edits.",
      "Keyboard parity: in an edit mode the arrow keys move a crosshair (about 8 px a press, 40 with Shift, or the `snap`), with its position written beside it, and the view follows it to the edge. Enter or Space places; for a goal, left and right then turn it 15° (45° with Shift) and Enter sets it. Enter or Space on a waypoint, or on a zone's corner with `editableZones`, picks it up; arrows carry it, Enter drops it, Esc puts it back. Delete or Backspace removes the selected waypoint, or a zone's last corner; Enter closes a zone of three corners or more; Esc cancels. Each step is said in an aria-live region (\"Goal set at 12.4, 8.0 m, heading 90°\").",
      "A banner in the top-left corner says what a click does now and how to finish or cancel; on a map 480 px wide or more it also says how to pan. Handles are 36 px targets with a mouse and 44 on touch (`--h-sm`), around a smaller drawing. `snap` (metres) rounds every point placed or moved; none by default. Points are kept on the plan.",
      "The waypoints' line is dashed grey while it is being drawn and the in-progress blue only with `waypointsPlanned`, once it is the route being driven. Goals and waypoints are ink, never a status colour; a drawn zone is a hairline outline like the others.",
      "Pass `labels` (status words, zone kinds, instructions, positions, empty, loading, error) to translate.",
    ],
  },
  "point-cloud": {
    what: "A LiDAR or depth point cloud in 3D, drawn with WebGL2: coloured by height or intensity on one hue, over a ground grid, with the robot at the origin; turned, panned and zoomed by pointer, touch and keyboard.",
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
      "Colours come from the theme (`--chart-1` into `--track`, starting at 20 %), read again when the theme or contrast changes. The footer shows the scale with its ends in words, the point count and, once the camera has moved, how long the last frame took from the start of drawing until the GPU finished it.",
      "Without WebGL2 it says so in words and still gives screen readers the point count and extent. Its buffers, programs and timers are freed on unmount; a context the GPU takes away is asked back, and everything is rebuilt and uploaded again when it returns.",
      "The pure parts are exported (`pointCloudBounds`, `fitPointCloudCamera`, `orbitPointCloudCamera`, `panPointCloudCamera`, `zoomPointCloudCamera`, `pointCloudCameraForKey`, `pointCloudColorRange`, `packPointCloud`) for apps that frame their own overlays or decode in a worker.",
      "Every string is in `labels`, including the axes' words and `formatTime` for the last scan's time.",
    ],
  },
  "robot-model": {
    what: "A robot's pose in 3D from its URDF and live joint values, for monitoring: neutral greys, a ground grid, axes named in words, and the joints that need someone highlighted and named.",
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
      "It draws only when something changes (joints, camera, size, theme) and frees its geometry, materials and WebGL context on unmount. A lost context says so and comes back by itself.",
      "Without WebGL (or with `webgl={false}`, for a device that should not draw 3D) it lists each joint's position in words, highlighted ones marked: the same facts, nothing hidden.",
      "The view is one Tab stop with `role=\"img\"` and a summary (robot, joint count, highlighted joints with their values). Its reset and fit buttons are out of the Tab order; 0 and F do the same.",
      "Every string is in `labels`, including `jointValue` (degrees and millimetres by default) and `formatTime` for the last update.",
    ],
  },
  graph: {
    what: "A directed graph that flows one way: boxes in columns, inputs on the left (or above), neutral lines between them, and a text view with the same nodes.",
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
      "Pass `labels` (from, to, status words, instructions, inputs, outputs, loading) and `empty` to translate.",
    ],
  },
  trace: {
    what: "The steps of a run in order, each with a status and a duration, that open to show input, output and sub-steps.",
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
    what: "A labelled divider across a log or feed, plus a one-line log row with a status glyph.",
    use: ["Day breaks in an event feed.", "Where an operator took over or autonomy resumed.", "An unread line in a log.", "Dense tool-call or command logs."],
    instead: ["A plain divider with no label: `separator`.", "Steps with durations and details: `trace`."],
    notes: [
      "Marker reads as text, not a separator role, so the label is announced.",
      "MarkerRow takes the StatusGlyph tones; danger and warning are also spoken.",
    ],
  },
  stepper: {
    what: "Shows where someone is in a fixed sequence of steps, which are done, and which failed.",
    use: ["Commissioning a robot.", "An import or upload wizard.", "A pre-shift checklist done in order."],
    instead: ["Sections of one page: `tabs`.", "Progress of a machine task: `progress`.", "Asking the questions themselves: `questionnaire`."],
    notes: ["value starts at 1; a value past the last step marks all done.", 'navigable="done" lets people click back to finished steps only.'],
  },
  timeline: {
    what: "A list of events in time order, each with a time, a marker and a title.",
    use: ["What a robot did on a shift.", "How an incident unfolded.", "Maintenance and release history."],
    instead: ["A sortable, filterable log: `data-grid`.", "Steps someone has to go through: `stepper`."],
    notes: ["tone draws the status glyph; colour only for warning and danger.", "TimelineHeading groups events by day."],
  },
  scrollspy: {
    what: "An On this page list that marks the section being read and scrolls to a section when clicked.",
    use: ["Long settings or detail pages.", "Docs pages.", "A robot's detail panel with many sections."],
    instead: ["Separate views people switch between: `tabs`."],
    notes: ["useScrollspy(ids) alone gives the current id for a custom display.", "Links move focus to the section, so keyboard users land there."],
  },
  "navigation-menu": {
    what: "The top navigation of a website: links, and triggers that open panels of links with descriptions.",
    use: ["A marketing or docs site header.", "A portal with a few product areas."],
    instead: ["An app's own sections: the app-shell block's sidebar.", "Actions on a thing: `dropdown-menu`.", "A path to the current page: `breadcrumb`."],
    notes: [
      "Use NavigationMenuLink (or navigationMenuTriggerStyle on it) for plain top-level links.",
      "viewport={false} puts each panel under its own trigger.",
    ],
  },
  questionnaire: {
    what: "A short form of questions with choice, scale and text answers, paged or on one page, that checks required answers.",
    use: ["Pre-shift checklists.", "Incident follow-up questions.", "Feedback and site surveys."],
    instead: ["A form of named fields (name, address): `field`.", "Only showing progress through steps: `stepper`."],
    notes: ["Answers are keyed by question id; onSubmit gets them all.", "QuestionField draws one question on its own inside your form."],
  },
  "data-grid": {
    what: "A full data table built on TanStack Table: you own the table state; DataGrid, DataGridTable and their parts draw it in the kit's style.",
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
      "Give each column meta.label so the visibility menu names it.",
      "Keep getRowId stable so selection survives sorting.",
      "data and columns must keep their identity between renders; an inline array (`rows.slice(0, 6)`, `[]`) re-renders forever once state auto-resets.",
    ],
  },
  sortable: {
    what: "A reorderable list or grid with a grip on each item, usable with a mouse, a finger or the keyboard.",
    use: ["Waypoint and patrol order.", "Rule priorities.", "Column order, camera layout, playlist steps."],
    instead: ["Ordering by a value (date, name): sort a `table` or `data-grid`.", "Moving items between lists: compose dnd-kit directly."],
    notes: ["Order lives in your state; onValueChange gets the new array.", "Touch drags start after a short press so the page still scrolls."],
  },
  resizable: {
    what: "A layout of panels whose sizes the user changes by dragging or with the keyboard.",
    use: ["A map beside a robot list.", "A camera above an event log.", "An editor beside its preview."],
    instead: ["A panel that slides in over content: `sheet`.", "Fixed app chrome: the app-shell block."],
    notes: ["autoSaveId on the group remembers sizes in the browser.", "collapsible panels collapse when dragged past their minSize."],
  },
  "file-upload": {
    what: "An area that takes files by drop or by the picker, validates them, and hands the accepted ones to you.",
    use: ["Maps, logs and recordings uploaded to a site.", "A single photo or avatar.", "A compact attach row in a form."],
    instead: ["Showing files already attached: `attachment`."],
    notes: ['accept uses the input\'s syntax: "image/*,.pgm".', "The upload itself and its progress are yours; FileUpload only selects."],
  },
  attachment: {
    what: "A file row, chip or image tile showing a file's type, name, size and state.",
    use: ["Upload queues with progress.", "Files attached to an incident or message.", "Image strips with previews."],
    instead: ["Picking files: `file-upload`.", "A file browser with many columns: `data-grid`."],
    notes: ["variant row, chip or image; status idle, uploading, done or error.", "Pass previewUrl (an object URL) for images."],
  },
  "file-type": {
    what: "A file icon chosen from the name or extension, in a tile, as a bare glyph or as a label.",
    use: ["File rows, upload queues and file browsers.", "Showing the format of a log, map or model."],
    instead: ["A generic icon surface: `icon-tile`."],
    notes: ["familyOf(name) tells you the family (map, model, data…) for your own logic.", "label overrides the written extension (db3 → ROS2)."],
  },
  autocomplete: {
    what: "A text field with a list of suggestions that narrows as you type, for picking one value from many.",
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
    what: "Boxes for a short code typed one character at a time: a verification code, a pairing code, a PIN.",
    use: ["Two-step sign-in and verification codes.", "Pairing a robot with a code from its screen.", "A short PIN to release a stop."],
    instead: ["A password: `input` with type password.", "A number with a range: `number-field`."],
    notes: [
      "Set pattern (REGEXP_ONLY_DIGITS) and maxLength to the code's length.",
      "autoComplete is one-time-code by default so phones offer the SMS code.",
      "The caret blinks only while focused and stops under reduced motion.",
    ],
  },
  "phone-input": {
    what: "A country picker joined to a phone field that formats the number as it is typed and gives back an international (E.164) number.",
    use: ["On-call numbers for alarm escalation.", "Site and customer contacts."],
    instead: ["A number that is not a phone (an ID, a count): `input` or `number-field`."],
    notes: [
      "Pasting a number that starts with + switches the country.",
      "Limit countryOptions to the countries you operate in to shorten the list.",
      "libphonenumber-js adds about 150 KB; load the page that needs it lazily if size matters.",
    ],
  },
  calendar: {
    what: "A month view to pick dates (react-day-picker): single, multiple or a range, one month or several.",
    use: ["Inline on a scheduling page.", "Inside a popover: use `date-selector`, which wraps it.", "Showing which days have events."],
    instead: ["A date field in a form: `date-selector`.", "A time of day: `time-picker`."],
    notes: [
      "Pass today in tests and stories so screenshots stay stable.",
      "disabled takes matchers: { before: date }, { dayOfWeek: [0, 6] }.",
      'captionLayout="dropdown" with startMonth and endMonth for distant dates.',
    ],
  },
  "date-selector": {
    what: "Form fields that open a calendar: DatePicker for one day and DateRangePicker for a from–to range.",
    use: ["A day or range in a form or a filter bar.", "Event and report ranges with presets."],
    instead: ["A calendar that is always visible: `calendar`.", "A time: `time-picker`."],
    notes: [
      "Values are Date objects (DateRange for ranges); format with date-fns.",
      "clearable adds an × that sets the value to undefined.",
      "DateRangePicker shows two months; pass numberOfMonths={1} in narrow panels.",
    ],
  },
  "time-picker": {
    what: "Two ways to enter a time: TimePicker picks from a grid of slots, TimeInput reads what is typed (930, 9:30, 21.30, 9:30 pm).",
    use: ["Schedules, quiet hours and charging windows.", "Opening-hour slots with some taken.", "Fast entry for people who know the time."],
    instead: ["A date: `date-selector`.", "A duration: `number-field` with a unit."],
    notes: [
      "step sets minutes between slots; min and max bound them.",
      "TimeInput marks unreadable or out-of-range text invalid and keeps the text so it can be fixed.",
    ],
  },
  item: {
    what: "A general-purpose row: a leading icon, avatar or image, a title with one or two lines below, and actions, a badge or a key at the end.",
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
    what: "A tile that gives an icon a consistent surface and size, so icons in rows, cards and empty states line up.",
    use: ["The media of a row or card.", "A status at a glance: a failed run, a warning.", "A feature or category heading."],
    instead: ["A person: `avatar`.", "A status next to text in a row: `status-glyph` or `status-eyebrow`."],
    notes: [
      "Use the soft or solid tones only for status, never to decorate a category.",
      "An interactive tile (asChild link) needs its own aria-label.",
      "IconTileDot needs a label; it is announced as an image.",
    ],
  },
  "text-diff": {
    what: "Where two texts differ, word by word: insertions a grey block with an underline, removals struck through, with a +3 words, −1 word summary.",
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
    what: "A key cap for shortcuts and keyboard instructions, alone or grouped into a chord.",
    use: ["Shortcut hints in menus, tooltips and search fields.", "A keyboard reference list.", "Instructions like Hold Space to stop all."],
    instead: ["A code value or ID: a <code> span in font-mono."],
    notes: [
      "Icon-only keys (arrows) need sr-only text inside; a <kbd> cannot take an aria-label.",
      "Inside a tooltip the key takes the tooltip's colours automatically.",
      "pressed (from useHotkeys' `pressed`) makes the key sink and its edge darken for a moment; it is a visual echo, so the result of the key still has to be said on screen.",
    ],
  },
  "button-group": {
    what: "A strip of joined controls that reads as one: neighbours share an edge and only the outer corners are round.",
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
    what: "A region that scrolls inside a fixed size, with a scrollbar that matches the theme on every platform.",
    use: ["A long log or list inside a card.", "A row of thumbnails that pans sideways.", "A wide table inside a panel."],
    instead: ["The whole page: let the page scroll.", "A data table with sorting: `table`, which scrolls by itself."],
    notes: [
      "Without a height it never scrolls; set h-* or max-h-*.",
      "fade hides the edges with a mask; do not use it when the first or last line must always be legible.",
    ],
  },
  "toggle-group": {
    what: "A row of toggle buttons where one (single) or several (multiple) can be on.",
    use: ["Time ranges, view modes and filters with a single choice.", "Map layers or notification channels where any mix is on."],
    instead: [
      "Switching views of the same data on a muted track: `segmented-control`.",
      "One on/off: `toggle`.",
      "A form choice saved on submit: `radio-group` or `checkbox`.",
    ],
    notes: [
      "Single mode allows clearing the value; guard against an empty value if one is required.",
      "Use joined={false} for filter chips that read as separate options.",
    ],
  },
  "choice-field": {
    what: "One choice as a whole tappable row: a checkbox, radio or switch with its label, a description and an optional count. FieldSet groups them under one question.",
    use: ["Filters with counts.", "Settings that switch on and off.", "Several answers to one question in a form."],
    instead: ["A single control with a label and nothing else: `label` next to it.", "Picking one of many: `select`."],
  },
  "metric-card": {
    what: "One headline number on a card: what it counts, the value, how it changed and a line of context, coloured only when the change is for the worse.",
    use: [
      "The row of numbers under a dashboard's page header: robots online, events, devices, API calls.",
      "A count that opens the list behind it (with `href`).",
    ],
    instead: [
      "A level in a known range (battery, storage, signal): `meter`.",
      "A number with a chart under it: a `card` with CardDataHeader and CardFigure.",
      "Several values about one thing (a robot's facts): `description-list`.",
    ],
    notes: [
      "Set `trend` from whether the change is good for the reader, not from its sign; only \"bad\" is coloured.",
      "Pass `unavailable` with the reason instead of value 0 when the source is down or the count is unknown.",
      "`labels` translates the words only screen readers hear (better, worse, loading, unavailable).",
    ],
  },
  meter: {
    what: "A level within a known range, like battery or storage, neutral until it crosses a threshold.",
    use: ["Battery, storage, signal strength, CPU.", "Inline in a table cell, or above a value in a card."],
    instead: ["Work that is under way and will finish: `progress`."],
    notes: [
      "Do not pass a tone: colour comes from `low` and `critical`.",
      "For values where higher is worse, set higherIsWorse.",
    ],
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
    notes: ["Pages are zero-based in code, one-based on screen."],
  },
  "copy-button": {
    what: "Copies a value and confirms it in place: the icon becomes a check for 1.5 s.",
    use: ["IDs, references, install commands, coordinates."],
    instead: ["Sharing a link to the current page: the browser already does it."],
  },
  "code-block": {
    what: "Code or a command to read and copy, in a frame with its title and a copy button.",
    use: [
      "Install and import commands (dvc import, npx shadcn add) and curl examples.",
      "A one-time API key or webhook secret, hidden until shown.",
      "Source and API responses in docs and settings pages.",
    ],
    instead: ["A short value inline (an ID, a reference): `copy-button` beside the text.", "A value someone edits: `input` or `textarea`."],
    notes: [
      "It has no highlighter: pass shiki's `<pre>` as children (the docs site does, in site/code-block.tsx); `code` stays the plain text that Copy copies.",
      "Highlighted shell commands wrap by words only if each name is marked nowrap in the HTML; the docs site's CodeBlock shows how.",
    ],
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
    notes: [
      "Variants: primary (one per screen), secondary, outline, ghost, destructive (danger outline, never a solid red fill), link.",
      "Sizes sm (36 px, mouse only; 44 on touch), md (44), lg (48), icon, icon-sm. Icons inside size themselves; pass none.",
      "`loading` shows a spinner only after 300 ms and keeps the button's width.",
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
    notes: [
      "Put addons inside the group as InputGroupAddon / InputGroupButton; the group draws the edge, focus and error, the Input inside draws nothing.",
      "A search field is an InputGroup with a Search icon addon. Never position an icon absolutely over an Input.",
    ],
  },
  "number-field": {
    what: "A number with a range, a step and a unit, with − and + buttons and full keyboard control.",
    use: ["Speed limits, battery thresholds, intervals, counts.", "Any value with limits the user should not exceed."],
    instead: ["A rough value where precision does not matter: `slider`.", "A number with no range, like an ID: `input` with inputMode numeric."],
    notes: [
      "`onValueChange` receives null when the field is cleared; type a controlled value as number | null.",
      "The value is kept in range on blur, never while typing. The − and + buttons are out of the Tab order; arrow keys do the same.",
    ],
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
  form: {
    what: "How to build a form with React Hook Form and the kit's Field, and an example to install and change. There is no form component: each control sits in a Controller and a Field, the way shadcn does it, so the kit itself depends on no form library.",
    use: ["Create and edit forms: a mission, a robot, a site, an account.", "Any form validated by a schema (zod, valibot) through a resolver."],
    instead: ["Filters above a list, which apply as you choose: `filter-form`.", "One field on its own with no submit (a search box): `search-field`."],
    notes: [
      "Installing the example brings react-hook-form, zod and @hookform/resolvers into your project; nothing else in the kit needs them. Another form library works the same way: put its error in Field's `error`.",
      "Map `field` to each control: spread it on an Input or Textarea; `value` / `onValueChange` and `ref` on the trigger for a Select; `checked` / `onCheckedChange` for a checkbox or switch.",
    ],
  },
  field: {
    what: "A label, a control and one line below for the hint or the error, with ids and ARIA connected for you.",
    use: ["Every form control that needs a label, help or validation.", "Errors that grow in below the control without moving the layout."],
    instead: ["A group of checkboxes or radios under one question: a fieldset with a legend."],
    notes: [
      "Exactly one child control. A Select works too: its trigger reads the Field through useField.",
      "Never add a second error paragraph under it.",
    ],
  },
  checkbox: {
    what: "A box that is checked, unchecked or partly checked. Changes apply when the form is saved.",
    use: ["Agreeing to terms.", "Choosing several items from a list.", "Select all, with the partly-checked state."],
    instead: ["A setting that applies immediately: `switch`.", "Exactly one of several options: `radio-group`."],
    notes: ["ChoiceField pairs it with its label for you."],
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
    notes: [
      "A switch applies at once: no Save button for it. Confirm with a toast if the change matters.",
      'In a list of settings, render it through ChoiceField with controlAt="end".',
    ],
  },
  select: {
    what: "A button that opens a list to pick one option from.",
    use: ["Six or more options, or options with long names.", "A compact choice in a table row or a toolbar."],
    instead: ["Two to five options worth seeing at once: `radio-group`.", "A long list the user needs to search: `autocomplete`."],
    notes: ["Inside a Field the trigger is labelled and described automatically; outside one, give the trigger an aria-label."],
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
    notes: [
      "Status tones only for status; licence tiers or categories use neutral or outline.",
      "For counts use CountBadge, never a Badge with a number and never a solid red circle.",
    ],
  },
  card: {
    what: "One raised surface that holds a group of related content.",
    use: ["A robot's summary, a KPI, a settings section."],
    instead: ["Rows of similar items: `list` or `table` inside one card. Cards are never nested.", "Label and value pairs: `description-list`."],
  },
  avatar: {
    what: "A person's picture or initials, round; a robot, site or team, square. With a status or count badge, and groups that fold into +N.",
    use: ["The signed-in user, an assignee, an author in a log.", "A robot or site next to its name in a list.", "Who is on shift, or which robots share a route, as a group."],
    instead: ["A robot's live state in a table: `status-glyph` and `inline-status`, not a badge on an avatar.", "A large icon in a coloured tile: `icon-tile`."],
  },
  separator: {
    what: "A hairline between groups of content.",
    use: ["Between sections of a menu, a card or a toolbar."],
    instead: ["Rows of a list: `list`, which draws inset dividers itself.", "Space alone, when the groups are already clear."],
  },
  progress: {
    what: "A bar that fills as work completes. Blue means in progress.",
    use: ["Uploads, map processing, a mission's completion."],
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
    notes: ["Sortable column: pass `sort` and `onSort` to TableHead; do not build your own header button."],
  },
  list: {
    what: "Rows on one surface with inset dividers; status as shape plus word.",
    use: ["Robots, missions or settings on phones and in side panels."],
    instead: ["Many columns to compare: `table`."],
  },
  "status-glyph": {
    what: "Status is a shape and a word; colour only when it is abnormal. The shapes: filled circle busy, hollow circle normal, triangle attention, square stopped, slashed circle offline.",
    use: ["Next to a robot's name, in tables and on the map."],
    instead: ["A state with its word: `status-eyebrow`.", "An alarm: `alarm`, which has its own shapes."],
    notes: [
      "Active and normal render in the foreground colour, not blue or green. The old `tone` maps info, success and neutral to active, normal and offline.",
    ],
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
    notes: [
      "Alarms are for what a person must act on, by ISA-18.2 priority (critical, high, low). Never show them as toasts.",
      "AlarmList sorts and announces new alarms itself; give it the data and onAcknowledge, and `acknowledgedAt` once acknowledged so the row says when.",
      "“Acknowledge all” appears only with `onAcknowledgeAll`, which receives the ids in view: never critical (acknowledged row by row), shelved, suppressed or out-of-service ones.",
    ],
  },
  alert: {
    what: "A message inside the page in a status tone, with an icon, a title and a description. It stays while its condition holds.",
    use: ["A form that cannot be saved, a robot that is offline, a setting that has a consequence."],
    instead: ["Something a person must act on now: `alarm`.", "Feedback that goes away by itself: `toast`."],
    notes: ["An alert stays while its condition holds; it has no close button."],
  },
  banner: {
    what: "A notice across the full width of the page or the app, above everything else, about the app itself. It stays while its condition holds.",
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
    what: "Short feedback on what the user just did, at the edge of the screen: 4 s, 8 s with an action, failures until dismissed.",
    use: ["Saved, copied, mission started, with Undo where possible."],
    instead: ["Anything that needs a person to act: `alarm`, never a toast.", "A state of the page: `alert`."],
    notes: [
      "Only feedback on the user's own action. Anything needing action is an Alarm.",
      "Mount <Toaster /> once; call toast() anywhere. Failures stay until dismissed.",
    ],
  },
  tabs: {
    what: "Sections of one page under a row of labels; one section shows at a time.",
    use: ["A robot's Overview, Sensors and Logs."],
    instead: ["Two to four views of the same data: `segmented-control`.", "Sections the user may want open together: `accordion`."],
  },
  tree: {
    what: "A hierarchy from data, with a guide line per level: a nested list of links people open and close, or a tree widget to pick one node in.",
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
    what: "Sections that open and close in place.",
    use: ["Long settings, FAQs, details the user rarely needs."],
    instead: ["Sections that are each a full view: `tabs`."],
  },
  dialog: {
    what: "A centered panel for a short task or decision, blocking the page until it is done or closed.",
    use: ["Rename, a short form, a choice with two or three outcomes."],
    instead: ["Confirming something that cannot be undone: `alert-dialog`.", "Longer content, or on phones: `sheet`."],
    notes: ["Short decisions only; on phones or for long content use Sheet.", "Always a DialogTitle; DialogDescription when there is anything to explain."],
  },
  "alert-dialog": {
    what: "A dialog that confirms an action that cannot be undone. The confirm button names the consequence.",
    use: ["Delete a route, stop all robots, revoke access."],
    instead: ["A reversible action: do it, and offer Undo in a `toast`."],
    notes: ['The confirm button names the consequence ("Delete route"), never "OK". Cancel has focus first.'],
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
  "hover-card": {
    what: "A preview of what a link leads to, on hover and keyboard focus: a robot's name, state, battery and last contact beside its ID.",
    use: ["Robot, site or dataset IDs in tables, event logs and text, where a glance saves opening the page."],
    instead: [
      "Anything someone needs, or anything to click: it is not on touch screens and screen readers are not told about it. Put it on the page, or in a `popover` opened by a click.",
      "The name of an icon button: `tooltip`.",
    ],
    notes: ["The trigger is always a real link (asChild on an `a` or your router's Link) to a page that has everything the card shows."],
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
    notes: ["Spread `chartMotion` onto marks; do not set Recharts animation timing."],
  },
  command: {
    what: "Search and run from the keyboard: a filterable list, and the ⌘K palette that opens over any page.",
    use: ["The app's search for robots, pages and actions (AppShell `search`).", "Picking from a long list by typing."],
    instead: ["Filtering a list on the page as you type: `input-group` with a search icon.", "A few options: `select`."],
    notes: [
      "In an app, pass AppShell `search` (groups with scope); it wires the field, the scope and ⌘K / Ctrl+K.",
      "Group results by kind; give robots a `tone` so their state shows its shape.",
    ],
  },
  "dropdown-menu": {
    what: "A menu of actions on an item, opened from a button. Destructive actions go last.",
    use: ["Row actions in a table, the user menu, overflow (⋯) buttons."],
    instead: ["Picking a value: `select`.", "One obvious action: a `button`."],
  },
  "context-menu": {
    what: "The menu a right-click or a long press opens on an item, in the dropdown menu's look. A shortcut to actions that are also on a visible control.",
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
    what: "The emergency stop: one touch stops, holding 2 s stops all; lying down it becomes wake and stand up.",
    use: ["Every screen that controls a robot, always in the same place."],
    instead: ["Any other destructive action: `button` with the destructive variant. Solid red belongs to the stop alone."],
    notes: [
      "UI only. Send the stop command, wait for the dog, fall back to Bluetooth after 1.5 s in the app, and pass the result back as `state`.",
      "Solid red belongs to this button alone. Fixed at 56 px (--h-stop).",
    ],
  },
  "slide-to-release": {
    what: "Releases a stopped robot with a deliberate slide: past 85% it releases, short of that it springs back.",
    use: ["Releasing an emergency stop, where a tap would be too easy in a panic."],
    instead: ["Routine confirmations: `alert-dialog`."],
    notes: ["Viewers get `locked`."],
  },
  "teleop-pad": {
    what: "A dead-man stick for driving a mobile robot by hand: it moves only while held, and stops the moment input is let go or lost.",
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
    what: "The bottom bar of the control app in three tiers: the state action, this page's primary action, navigation.",
    use: ["Every page of the phone control app."],
    instead: ["Internal tools on desktop: the app shell's sidebar."],
  },
  island: {
    what: "The top of the control app: name, device status and notifications, each expanding on its own, with the most urgent alarm inside.",
    use: ["Every page of the phone control app."],
    instead: ["Internal tools: the app shell's top bar."],
    notes: ["Pair with `edge={alarmEdge(topAlarm(alarms)) ?? stateEdge}`, where stateEdge is the persistent fault (stopped: danger; offline stays neutral), so a low alarm does not erase it. Put IslandAlarm inside, from the same alarm data as AlarmList."],
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
  "use-debounce": {
    what: "A value or a function call that waits until changes pause: useDebouncedValue and useDebouncedCallback.",
    use: ["A search sent to a server when the typing stops (autocomplete's `debounce` uses it).", "Autosave after edits pause."],
    instead: ["Something the person must see at once: update it directly, never debounced."],
  },
  "use-hotkeys": {
    what: "Keyboard shortcuts as a map of keys to handlers ({ \"1\": yes, \"mod+z\": undo, \"?\": help }), quiet while someone types, with the key being pressed for Kbd.",
    use: ["A review or labelling queue answered by keyboard.", "A tool's global shortcuts, like mod+k for search."],
    instead: ["Keys inside one widget (arrows in a list): the widget's own onKeyDown, or the Radix component that has them."],
    notes: [
      "mod is ⌘ on Mac and Ctrl elsewhere. Symbols like ? match whatever Shift it took; letters need the exact modifiers, so mod+z never fires on mod+shift+z.",
      "Held keys do not repeat unless a binding sets repeat: holding 1 answers once.",
      "Returns `pressed`, the binding whose key is down (kept at least 150 ms), for <Kbd pressed>.",
    ],
  },
  "use-slide-release": {
    what: "A hook with the drag, threshold and spring-back logic behind slide to release.",
    use: ["Building another slide-to-confirm control."],
    instead: ["Releasing a stop: `slide-to-release`, which uses it."],
  },
}
