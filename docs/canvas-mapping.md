# Design canvas → code

| Canvas board | In this repo | Status |
| --- | --- | --- |
| Style guideline: colours and values | `registry/syncrobotic/styles/syncrobotic-theme.css` | Done |
| Status marking | `status-glyph`, `status-eyebrow` | Done |
| Error handling rules (timing) | Component defaults: long press 2000 ms, slide threshold 85%, spring-back 200 ms, spinner only after 300 ms | Partial (spinner not yet a component) |
| Components: shell → dynamic island | `island` (`Island`, `IslandNotice`) | Done; the content of each zone's panel is composed by the app |
| Components: shell → dock | `dock` (`Dock`, `DockActions`, `DockNav`) | Done |
| Components: shell → emergency stop | `stop-button`, `slide-to-release` | Done |
| State machines: emergency stop, dock, dynamic island | One story per state in `stories/` | Done |
| Components: data → grouped list | `list` | Done |
| Components: data → loading | `skeleton` | Done |
| Components: actions and input → button, segmented control, switch, input | shadcn components restyled to the system's radius and selected state | To do |
| State machines: button, switch, input | Matching stories | To do |
| Robot state machine (17 states) | Full-screen stories | To do |
| 3D point cloud map | Map component (Three.js or deck.gl) | To do; needs the point cloud format from R&D |

## Differences from the canvas

- Theme v0.9: light mode defined `--ring` twice, and the tray edge value overrode the focus ring colour. The tray edge is now `--edge` (Tailwind: `ring-edge`).
- Added `animate-breath` (the whole skeleton breathes over 1.2 s), turned off under reduced motion.
- Default copy is English. Every string can be replaced through props.
