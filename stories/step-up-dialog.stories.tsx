import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Trash2 } from "lucide-react"
import { isStepUpCancelled, type StepUpProof, useStepUp } from "@/registry/syncrobotic/hooks/use-step-up"
import { stepUpDialogLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { StepUpDialog } from "@/registry/syncrobotic/ui/step-up-dialog"

const meta: Meta = { title: "Overlays/Step-up dialog" }
export default meta
type S = StoryObj

// A stand-in auth server: 123456 or "correct horse" passes, anything else is refused with a code.
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
async function verify({ method, value }: StepUpProof) {
  await wait(400)
  if (method === "totp" ? value !== "123456" : value !== "correct horse")
    throw { error: { code: method === "totp" ? "INVALID_CODE" : "INVALID_PASSWORD", message: "Unauthorized" } }
}

function Opener({ label = "Revoke API key", ...props }: Partial<React.ComponentProps<typeof StepUpDialog>> & { label?: string }) {
  const [open, setOpen] = React.useState(false)
  const [said, setSaid] = React.useState("")
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden="true" />
        {label}
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {said}
      </p>
      <StepUpDialog
        open={open}
        verify={verify}
        onVerified={() => {
          setOpen(false)
          setSaid("Verified. The key was revoked.")
        }}
        onCancel={() => {
          setOpen(false)
          setSaid("Cancelled. Nothing was changed.")
        }}
        {...props}
      />
    </div>
  )
}

/** The code from an authenticator app, sent on its sixth digit. Try 123456; any other code is refused and the field clears. */
export const StepUpDialogCode: S = { render: () => <Opener /> }

/** Both proofs offered: the code first, the password one link away. The password here is "correct horse". */
export const StepUpDialogPassword: S = { render: () => <Opener methods={["password", "totp"]} /> }

/** No second factor yet (TWO_FACTOR_SETUP_REQUIRED): nothing to check, so it offers the setup and cancels the action. */
export const StepUpDialogSetup: S = { render: () => <Opener setup onSetup={() => {}} /> }

/** The dialog as it opens. */
export const StepUpDialogOpen: S = {
  render: () => <StepUpDialog open verify={verify} onVerified={() => {}} onCancel={() => {}} />,
}

/** In Traditional Chinese, through `stepUpDialogLabels`. */
export const StepUpDialogZhTw: S = { render: () => <Opener label="撤銷 API 金鑰" labels={stepUpDialogLabels} /> }

/**
 * useStepUp around a server call: the first call answers ELEVATED_SESSION_REQUIRED, the hook holds it and opens the
 * dialog, and after 123456 it replays the call, which now succeeds. Cancel rejects it, and nothing runs.
 */
export const UseStepUpReplay: S = {
  render: function Render() {
    // The server's side of the session, read when the call runs (the replay included), not when it was written.
    const session = React.useRef({ elevated: false })
    const [log, setLog] = React.useState<string[]>([])
    const note = (line: string) => setLog((l) => [...l, line])
    const stepUp = useStepUp({
      verify: async (proof) => {
        await verify(proof)
        session.current.elevated = true
      },
    })
    // The server: refuses until the session is elevated.
    const deleteKey = async () => {
      await wait(200)
      if (!session.current.elevated) throw { error: { code: "ELEVATED_SESSION_REQUIRED", message: "Forbidden" } }
      return "key_7f3a"
    }
    return (
      <div className="flex flex-col items-start gap-3">
        <Button
          variant="destructive"
          onClick={async () => {
            note("Asked the server to delete key_7f3a.")
            try {
              note(`Deleted ${await stepUp.run(deleteKey)}.`)
            } catch (e) {
              note(isStepUpCancelled(e) ? "Cancelled: the key was not deleted." : "The server refused.")
            }
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete API key
        </Button>
        <ol role="log" aria-label="What happened" className="flex flex-col gap-1 text-sm text-muted-foreground">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
        <StepUpDialog {...stepUp.dialog} />
      </div>
    )
  },
}
