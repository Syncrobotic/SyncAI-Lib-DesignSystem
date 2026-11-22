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
        <Field label="Phone">
          <PhoneInput value={v} onValueChange={setV} />
        </Field>
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
  render: () => (
    <Field label="Tokyo site phone">
      <PhoneInput defaultCountry="JP" />
    </Field>
  ),
}

export const PhoneInputLimitedCountries: S = {
  render: () => (
    <Field label="Support phone" hint="Support lines run in Taiwan, Japan, Singapore and the US.">
      <PhoneInput defaultCountry="TW" countryOptions={["TW", "JP", "SG", "US"]} />
    </Field>
  ),
}

export const PhoneInputReadOnly: S = {
  render: () => (
    <Field label="Account phone" hint="Change it in your account settings.">
      <PhoneInput value="+6591234567" readOnly />
    </Field>
  ),
}

export const PhoneInputDisabled: S = {
  render: () => (
    <Field label="Phone" hint="Text alerts are off for this site.">
      <PhoneInput disabled />
    </Field>
  ),
}
