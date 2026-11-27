// @syncrobotic/input-modality v0.53.0 · update: npx shadcn add @syncrobotic/input-modality --overwrite
/*
  Whether the last input on the page was a key or a pointer, from one pair of document listeners for the whole page:
  menus, lists and trees ring their row only in keyboard use. The listeners capture, attached on the first
  trackInputModality() (called as a module loads, so the key press that opens a menu is counted), never on the server.
*/

export type InputModality = "key" | "pointer"

let last: InputModality = "pointer"
let tracking = false

/** Starts following keys and pointers on the document, once per page. Safe to call any number of times, and on the server. */
export function trackInputModality() {
  if (tracking || typeof document === "undefined") return
  tracking = true
  document.addEventListener("keydown", () => (last = "key"), true)
  document.addEventListener("pointerdown", () => (last = "pointer"), true)
}

/** "key" when the last input on the page was a key press, "pointer" after a pointer press (and before anything). */
export function getLastInput(): InputModality {
  trackInputModality()
  return last
}
