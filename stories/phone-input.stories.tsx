import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Field } from "@/registry/syncrobotic/ui/field"
import { isPhoneValid, PhoneInput } from "@/registry/syncrobotic/ui/phone-input"

const meta: Meta = { title: "Inputs/Phone input" }
export default meta
type S = StoryObj

export const PhoneInputDefault: S = {
  render: function P() {
    const [v, setV] = React.useState<string | undefined>()
    return (
      <div className="flex flex-col gap-2">
        <PhoneInput value={v} onValueChange={setV} />
        <p className="font-mono text-xs text-muted-foreground">Stored as: {v ?? "—"}</p>
      </div>
    )
  },
}

export const PhoneInputInField: S = {
  render: function P() {
    const [v, setV] = React.useState<string | undefined>("+886912345678")
    return (
      <Field label="On-call phone" hint="Gets a call when a critical alarm is not acknowledged in 2 minutes.">
        <PhoneInput value={v} onValueChange={setV} />
      </Field>
    )
  },
}

export const PhoneInputValidated: S = {
  render: function P() {
    const [v, setV] = React.useState<string | undefined>("+8869123")
    const [touched, setTouched] = React.useState(true)
    const bad = touched && !!v && !isPhoneValid(v)
    return (
      <div onBlur={() => setTouched(true)}>
        <Field label="Site contact" error={bad ? "This number is incomplete for Taiwan." : undefined}>
          <PhoneInput value={v} onValueChange={setV} />
        </Field>
      </div>
    )
  },
}

export const PhoneInputOtherCountry: S = {
  render: () => <PhoneInput defaultCountry="JP" aria-label="Tokyo site phone" />,
}

export const PhoneInputLimitedCountries: S = {
  render: () => <PhoneInput defaultCountry="TW" countryOptions={["TW", "JP", "SG", "US"]} aria-label="Support phone" />,
}

export const PhoneInputReadOnly: S = {
  render: () => <PhoneInput value="+6591234567" readOnly aria-label="Account phone" />,
}

export const PhoneInputDisabled: S = {
  render: () => <PhoneInput disabled aria-label="Phone" />,
}
