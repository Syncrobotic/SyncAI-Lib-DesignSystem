import type { Meta, StoryObj } from "@storybook/react-vite"
import { MediaPlayer, type MediaMarker } from "@/registry/syncrobotic/ui/media-player"

const meta: Meta = { title: "Display/Media player" }
export default meta
type S = StoryObj

// The sample clip is generated, not filmed: 60 s, 320 × 180, VP9 WebM, 30 KB, in public/media (served to Storybook by
// staticDirs). A bright floor, so the controls are seen over a light picture; a robot drives in, stops at an obstacle at
// 0:42 and goes on at 0:50. WebM because Chromium without proprietary codecs (Playwright's) does not play H.264.
// A canvas captureStream would avoid the file, but it is a live stream: no length, no seeking, nothing this player is for.
// Made with:
//   ffmpeg -f lavfi -i "color=c=0xe8e6e1:size=320x180:rate=10:duration=60" -vf "drawgrid=w=32:h=32:t=1:c=0xc9c6bf,
//     drawbox=x=0:y=120:w=320:h=60:c=0xd6d3cc:t=fill,
//     drawbox=x='if(lt(t,42),t*5-40,if(lt(t,50),170,170+(t-50)*5))':y=96:w=40:h=28:c=0x55585f:t=fill,
//     drawbox=x=214:y=104:w=14:h=20:c=0xb5762a:t=fill:enable='between(t,30,50)',
//     drawtext=text='CAM 1  %{pts\:hms}':x=8:y=8:fontsize=11:fontcolor=0x33363c"
//     -c:v libvpx-vp9 -b:v 0 -crf 52 -an patrol-clip.webm
//   ffmpeg -i patrol-clip.webm -frames:v 1 -c:v libwebp -quality 70 patrol-clip-poster.webp
const clip = "/media/patrol-clip.webm"
const poster = "/media/patrol-clip-poster.webp"
const captions = [{ src: "/media/patrol-clip.vtt", srcLang: "en", label: "English" }]
const markers: MediaMarker[] = [
  { time: 2, label: "Patrol started, aisle 4" },
  { time: 42, label: "Obstacle, stopped" },
  { time: 50, label: "Path clear, resumed" },
]

/** An incident's clip: the events on the timeline and listed under it, captions available, the length known before loading. */
export const MediaPlayerIncident: S = {
  render: () => (
    <MediaPlayer label="Patrol dog 7F3A, front camera, today 14:02" src={clip} poster={poster} duration={60} markers={markers} tracks={captions} />
  ),
}

// Windows of time, not moments: how long the person stood in the robot's path, how long it waited at the obstacle.
const windows: MediaMarker[] = [
  { time: 2, label: "Patrol started, aisle 4" },
  { time: 18, end: 31, label: "Person in path" },
  { time: 42, end: 50, label: "Stopped at obstacle" },
]

/** A marker with an `end` is a window: a bracket from start to end above the track, apart from the played fill. A press goes to its start; hover shows its range. */
export const MediaPlayerRanges: S = {
  render: () => (
    <MediaPlayer label="Patrol dog 7F3A, front camera, today 14:02" src={clip} poster={poster} duration={60} markers={windows} />
  ),
}

const grid = [
  { label: "Patrol dog 7F3A, front camera, today 14:02", markers: windows },
  { label: "Patrol dog 7F3A, rear camera, today 14:02", markers: [{ time: 42, end: 50, label: "Stopped at obstacle" }] },
  { label: "Forklift 2, front camera, today 13:47", markers: markers.slice(0, 2) },
]

/** A grid of clips: `markerList="collapsed"` folds each list behind "3 events", so every card is the picture and one row, and the grid lines up. */
export const MediaPlayerGrid: S = {
  render: () => (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
      {grid.map((c) => (
        <MediaPlayer key={c.label} label={c.label} src={clip} poster={poster} duration={60} preload="none" markers={c.markers} markerList="collapsed" />
      ))}
    </div>
  ),
}

/** Opened at the event: an incident links to the moment it fired, not to the start of the recording. */
export const MediaPlayerAtEvent: S = {
  render: () => <MediaPlayer label="Patrol dog 7F3A, front camera, today 14:02" src={clip} poster={poster} duration={60} startAt={40} />,
}

/** In a list of clips nothing is fetched until Play; the length comes from the clip's record. */
export const MediaPlayerPlain: S = {
  render: () => <MediaPlayer label="Forklift 2, rear camera, yesterday 09:15" src={clip} poster={poster} duration={60} preload="none" />,
}

/** While the clip's link is fetched: the poster and a spinner, no controls to press yet. */
export const MediaPlayerLoading: S = {
  render: () => <MediaPlayer label="Patrol dog 7F3A, front camera, today 14:02" poster={poster} duration={60} loading />,
}

/** Known before loading that it cannot play: why, and a retry only because fetching a new link can help. */
export const MediaPlayerUnavailable: S = {
  render: () => (
    <MediaPlayer
      label="Patrol dog 7F3A, front camera, today 14:02"
      poster={poster}
      unavailable="the download link expired."
      onRetry={() => {}}
    />
  ),
}

/** Not uploaded yet: nothing to retry, so no button. The reason says when it will be there. */
export const MediaPlayerNotUploaded: S = {
  render: () => <MediaPlayer label="Delivery bot 3, front camera, today 16:40" unavailable="the robot uploads it when it next docks." />,
}
