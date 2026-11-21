import * as React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FileUpload, formatBytes, matchesAccept, type FileRejection } from "@/registry/syncrobotic/ui/file-upload"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const file = (name: string, size = 10, type = "") => new File([new Uint8Array(size)], name, { type })

const setup = (props: Partial<React.ComponentProps<typeof FileUpload>> = {}) => {
  const onFiles = vi.fn<(files: File[]) => void>()
  const onReject = vi.fn<(r: FileRejection[]) => void>()
  const utils = render(<FileUpload onFiles={onFiles} onReject={onReject} title="Drop a site map" {...props} />)
  const zone = screen.getByRole("button", { name: /Drop a site map/ })
  const input = utils.container.querySelector<HTMLInputElement>('input[type="file"]')!
  const drop = (files: File[]) => fireEvent.drop(zone, { dataTransfer: { files, types: ["Files"] } })
  const pick = (files: File[]) => {
    Object.defineProperty(input, "files", { value: files, configurable: true })
    fireEvent.change(input)
  }
  return { ...utils, zone, input, drop, pick, onFiles, onReject }
}

/** The story's way of turning rejections into words (stories/file-upload.stories.tsx). */
const reasons = { type: "is not a supported type", size: "is too large", count: "is over the file limit" }
function WithMessages(props: Partial<React.ComponentProps<typeof FileUpload>>) {
  const [error, setError] = React.useState<string>()
  const [files, setFiles] = React.useState<File[]>([])
  return (
    <div>
      <FileUpload
        title="Drop a site map"
        onFiles={(f) => {
          setFiles((p) => [...p, ...f])
          setError(undefined)
        }}
        onReject={(r) => setError(r.map((x) => `${x.file.name} ${reasons[x.reason]}`).join(". "))}
        {...props}
      />
      {error && <p role="alert">{error}</p>}
      <ul aria-label="Files">
        {files.map((f) => (
          <li key={f.name}>
            {f.name}
            <button type="button" onClick={() => setFiles((p) => p.filter((x) => x !== f))}>
              Remove {f.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

describe("FileUpload", () => {
  it("is a focusable button named by its title and described by its hint", () => {
    const { zone } = setup({ hint: ".pgm or .pcd, up to 200 MB" })
    expect(zone.getAttribute("tabindex")).toBe("0")
    expect(zone.hasAttribute("aria-disabled")).toBe(false)
    const hint = document.getElementById(zone.getAttribute("aria-describedby")!)
    expect(hint?.textContent).toBe(".pgm or .pcd, up to 200 MB")
  })

  it("has no aria-describedby without a hint, and shows the default title", () => {
    render(<FileUpload onFiles={() => {}} />)
    const zone = screen.getByRole("button", { name: "Drop files here or choose files" })
    expect(zone.hasAttribute("aria-describedby")).toBe(false)
  })

  it("passes accept and multiple to the hidden input", () => {
    const { input } = setup({ accept: ".pgm,.yaml" })
    expect(input.hidden).toBe(true)
    expect(input.getAttribute("accept")).toBe(".pgm,.yaml")
    expect(input.multiple).toBe(true)
    cleanup()
    expect(setup({ multiple: false }).input.multiple).toBe(false)
  })

  it("opens the picker on click, Enter and Space, and keeps the page from scrolling on Space", () => {
    const { zone, input } = setup()
    const click = vi.spyOn(input, "click").mockImplementation(() => {})
    fireEvent.click(zone)
    expect(click).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(zone, { key: "Enter" })
    expect(click).toHaveBeenCalledTimes(2)
    const space = fireEvent.keyDown(zone, { key: " " })
    expect(click).toHaveBeenCalledTimes(3)
    expect(space).toBe(false) // default prevented
    fireEvent.keyDown(zone, { key: "a" })
    expect(click).toHaveBeenCalledTimes(3)
  })

  it("hands over files chosen in the picker, and clears the input so the same file can be chosen again", () => {
    const { input, pick, onFiles, onReject } = setup()
    const map = file("hall-b.pgm")
    pick([map])
    expect(onFiles).toHaveBeenCalledWith([map])
    expect(onReject).not.toHaveBeenCalled()
    expect(input.value).toBe("")
  })

  it("takes dropped files, and marks the zone while a drag is over it", () => {
    const { zone, drop, onFiles } = setup()
    expect(zone.hasAttribute("data-over")).toBe(false)
    const over = fireEvent.dragOver(zone)
    expect(over).toBe(false) // default prevented, so the browser allows the drop
    expect(zone.hasAttribute("data-over")).toBe(true)
    fireEvent.dragLeave(zone)
    expect(zone.hasAttribute("data-over")).toBe(false)
    fireEvent.dragOver(zone)
    const a = file("a.pgm")
    const b = file("b.yaml")
    drop([a, b])
    expect(zone.hasAttribute("data-over")).toBe(false)
    expect(onFiles).toHaveBeenCalledWith([a, b])
  })

  it("refuses files that do not match accept, by extension or MIME type", () => {
    const { drop, onFiles, onReject } = setup({ accept: "image/*,.pgm" })
    const photo = file("dock.JPG", 10, "image/jpeg")
    const map = file("HALL.PGM")
    const log = file("run.bag", 10, "application/octet-stream")
    drop([photo, map, log])
    expect(onFiles).toHaveBeenCalledWith([photo, map])
    expect(onReject).toHaveBeenCalledWith([{ file: log, reason: "type" }])
  })

  it("refuses files over maxSize, and keeps a file exactly at the limit", () => {
    const { drop, onFiles, onReject } = setup({ maxSize: 100 })
    const exact = file("exact.pgm", 100)
    const big = file("big.pgm", 101)
    drop([exact, big])
    expect(onFiles).toHaveBeenCalledWith([exact])
    expect(onReject).toHaveBeenCalledWith([{ file: big, reason: "size" }])
  })

  it("refuses files past maxFiles, counting only the files it took", () => {
    const { drop, onFiles, onReject } = setup({ maxFiles: 2, accept: ".pgm" })
    const [a, wrong, b, c] = [file("a.pgm"), file("x.txt"), file("b.pgm"), file("c.pgm")]
    drop([a, wrong, b, c])
    expect(onFiles).toHaveBeenCalledWith([a, b])
    expect(onReject).toHaveBeenCalledWith([
      { file: wrong, reason: "type" },
      { file: c, reason: "count" },
    ])
  })

  it("gives the type reason before the size reason", () => {
    const { drop, onReject } = setup({ accept: ".pgm", maxSize: 1 })
    const both = file("big.txt", 50)
    drop([both])
    expect(onReject).toHaveBeenCalledWith([{ file: both, reason: "type" }])
  })

  it("does not call onFiles when every file is refused, and works without onReject", () => {
    const onFiles = vi.fn()
    render(<FileUpload onFiles={onFiles} accept=".pgm" />)
    const zone = screen.getByRole("button")
    expect(() => fireEvent.drop(zone, { dataTransfer: { files: [file("x.txt")] } })).not.toThrow()
    expect(onFiles).not.toHaveBeenCalled()
  })

  it("hands over one file when multiple is false", () => {
    const { drop, onFiles } = setup({ multiple: false })
    const a = file("a.png")
    drop([a, file("b.png")])
    expect(onFiles).toHaveBeenCalledWith([a])
  })

  it("shows refused files by name and reason, and clears the message after a good file", () => {
    render(<WithMessages accept=".pgm" maxSize={100} />)
    const zone = screen.getByRole("button", { name: /Drop a site map/ })
    fireEvent.drop(zone, { dataTransfer: { files: [file("notes.txt"), file("huge.pgm", 500)] } })
    expect(screen.getByRole("alert").textContent).toBe("notes.txt is not a supported type. huge.pgm is too large")
    fireEvent.drop(zone, { dataTransfer: { files: [file("hall.pgm")] } })
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByRole("list", { name: "Files" }).textContent).toContain("hall.pgm")
  })

  it("lets a taken file be removed from the list", () => {
    render(<WithMessages />)
    const zone = screen.getByRole("button", { name: /Drop a site map/ })
    fireEvent.drop(zone, { dataTransfer: { files: [file("a.pgm"), file("b.pgm")] } })
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    fireEvent.click(screen.getByRole("button", { name: "Remove a.pgm" }))
    expect(screen.getAllByRole("listitem").map((li) => li.firstChild?.textContent)).toEqual(["b.pgm"])
  })

  it("does nothing when disabled: not focusable, no picker, no drop, no drag highlight", () => {
    const { zone, input, drop, pick, onFiles, onReject } = setup({ disabled: true })
    const click = vi.spyOn(input, "click").mockImplementation(() => {})
    expect(zone.getAttribute("aria-disabled")).toBe("true")
    expect(zone.getAttribute("tabindex")).toBe("-1")
    expect(input.disabled).toBe(true)
    fireEvent.click(zone)
    fireEvent.keyDown(zone, { key: "Enter" })
    fireEvent.keyDown(zone, { key: " " })
    expect(click).not.toHaveBeenCalled()
    fireEvent.dragOver(zone)
    expect(zone.hasAttribute("data-over")).toBe(false)
    drop([file("a.pgm")])
    pick([file("b.pgm")])
    expect(onFiles).not.toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })

  it("replaces the default content with children", () => {
    render(
      <FileUpload onFiles={() => {}} title="Unused">
        <span>Upload robot photo</span>
      </FileUpload>,
    )
    expect(screen.getByRole("button", { name: "Upload robot photo" })).toBeTruthy()
    expect(screen.queryByText("Unused")).toBeNull()
  })

  // Was a bug, fixed in 0.24.1: with multiple={false}, take() hands over ok.slice(0, 1) and silently drops the rest (file-upload.tsx:79).
  // The component promises to report "what it refused and why", and the catalog rule is "Report refused files by name
  // and reason", but the extra dropped files never reach onReject. They should be rejected with reason "count".
  it("reports the extra files as count rejections when multiple is false", () => {
    const { drop, onReject } = setup({ multiple: false })
    const b = file("b.png")
    const c = file("c.png")
    drop([file("a.png"), b, c])
    expect(onReject).toHaveBeenCalledWith([
      { file: b, reason: "count" },
      { file: c, reason: "count" },
    ])
  })

  // Was a bug, fixed in 0.24.1: FileUpload does not accept or forward any other props to its role="button" element (file-upload.tsx:31-63,
  // 84-117), so aria-label is silently dropped. The FileUploadAvatar story passes aria-label="Robot photo" (TypeScript
  // allows any hyphenated attribute), and a zone whose only child is an icon is then left without an accessible name.
  it("names the zone with aria-label", () => {
    const Loose = FileUpload as unknown as React.ComponentType<Record<string, unknown>>
    render(
      <Loose onFiles={() => {}} aria-label="Robot photo">
        <svg aria-hidden="true" />
      </Loose>,
    )
    expect(screen.getByRole("button", { name: "Robot photo" })).toBeTruthy()
  })
})

describe("matchesAccept", () => {
  it("matches like the browser's picker: extensions, wildcards, exact MIME types, any case", () => {
    expect(matchesAccept(file("a.PGM"), ".pgm")).toBe(true)
    expect(matchesAccept(file("a.png", 1, "image/png"), "image/*")).toBe(true)
    expect(matchesAccept(file("a.mp4", 1, "video/mp4"), "image/*")).toBe(false)
    expect(matchesAccept(file("a.json", 1, "application/json"), " application/json , .pgm")).toBe(true)
    expect(matchesAccept(file("a.txt"), "")).toBe(true)
    expect(matchesAccept(file("a.txt"), undefined)).toBe(true)
    expect(matchesAccept(file("a.txt"), ",")).toBe(false)
  })
})

describe("formatBytes", () => {
  it("picks the unit", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(50 * 1024 ** 2)).toBe("50.0 MB")
    expect(formatBytes(2.4 * 1024 ** 3)).toBe("2.4 GB")
  })
})
