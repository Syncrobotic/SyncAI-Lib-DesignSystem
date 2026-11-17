import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@/registry/syncrobotic/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "@/registry/syncrobotic/ui/input-otp"

const meta: Meta = { title: "Inputs/Input OTP" }
export default meta
type S = StoryObj

export const InputOTPSixDigits: S = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} aria-label="Verification code">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
}

export const InputOTPWithSeparator: S = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} aria-label="Verification code">
      <InputOTPGroup>
        {[0, 1, 2].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
}

export const InputOTPPairingCode: S = {
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Pairing code on the robot's screen</span>
      <InputOTP maxLength={8} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} inputMode="text" aria-label="Pairing code" onChange={() => {}}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          {[4, 5, 6, 7].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-muted-foreground">Letters and numbers, as shown on Patrol dog 7F3A.</p>
    </div>
  ),
}

export const InputOTPPin: S = {
  render: () => (
    <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} aria-label="Release PIN" containerClassName="[&_[data-slot=input-otp-slot]]:text-transparent">
      <InputOTPGroup>
        {[0, 1, 2, 3].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
}

export const InputOTPFilled: S = {
  render: () => (
    <InputOTP maxLength={6} value="482913" aria-label="Verification code" onChange={() => {}}>
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
}

export const InputOTPVerify: S = {
  render: function V() {
    const [code, setCode] = React.useState("")
    const [error, setError] = React.useState(false)
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setError(code !== "123456")
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Enter the 6-digit code</span>
          <span className="text-sm text-muted-foreground">We sent it to •••• 2913. It expires in 10 minutes.</span>
        </div>
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={(v) => {
            setCode(v)
            setError(false)
          }}
          aria-label="Verification code"
          aria-invalid={error || undefined}
          aria-describedby={error ? "otp-error" : undefined}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} aria-invalid={error || undefined} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error && (
          <p id="otp-error" className="text-xs text-danger">
            That code is not right. Check the message and try again.
          </p>
        )}
        <Button type="submit" disabled={code.length < 6}>
          Verify
        </Button>
      </form>
    )
  },
}
