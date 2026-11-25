// @syncrobotic/input-modality v0.36.0 · update: npx shadcn add @syncrobotic/input-modality --overwrite
/*
  The last way anyone moved on the page: keys or a pointer. Menus, lists and trees ring their highlighted row only in
  keyboard use and keep the calm fill under the pointer, so each asks which came last when it opens or takes focus.

  One pair of capture listeners on the document for the whole page, attached the first time anything asks (a component
  calls trackInputModality() as its module loads, so the key press that opens a menu is already counted), never on the
  server.
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
