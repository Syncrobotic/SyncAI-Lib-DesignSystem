// @syncrobotic/feedback v0.51.0 · update: npx shadcn add @syncrobotic/feedback --overwrite

/*
  Touch and sound, as tokens: an operator in gloves or machine noise cannot rely on the screen, so a stop sent or a
  critical alarm also buzzes (and an alarm sounds), each with one fixed pattern. iOS Safari has no Vibration API, so touch
  is never the only signal. Browsers block sound until the first touch: an app relying on alarm sound asks for one tap at
  sign-in.
*/

/** Vibration patterns in ms: on, off, on… */
export const haptics = {
  /** The stop left the device: one short pulse, at the moment of touch. */
  stopSent: [40],
  /** The robot confirmed it stopped: two pulses. */
  stopConfirmed: [40, 80, 40],
  /** No confirmation in time: two long pulses, press again. */
  stopUnconfirmed: [200, 100, 200],
  /** Slide to release reached the end. */
  release: [30],
  /** Manual driving began: the teleop pad was pressed. One short tick. */
  driveStart: [15],
  /** Manual driving ended, by release or lost input: two short ticks, so the hand knows the robot was told to stop. */
  driveStop: [15, 60, 15],
  /** A new critical alarm: three long pulses. */
  alarmCritical: [200, 100, 200, 100, 200],
  /** A new high alarm: two medium pulses. Low alarms do not buzz. */
  alarmHigh: [120, 80, 120],
} as const satisfies Record<string, readonly number[]>

/**
 * Alarm tones, in the burst rhythm of IEC 60601-1-8 so they read as alarms and not as notifications: critical is a
 * 3 + 2 burst, high a 3-pulse burst, both on one pitch. Low alarms are silent. Only alarms make sound.
 */
export const tones = {
  alarmCritical: { hz: 880, pulse: 100, starts: [0, 150, 300, 600, 750] },
  alarmHigh: { hz: 660, pulse: 120, starts: [0, 200, 400] },
} as const satisfies Partial<Record<keyof typeof haptics, { hz: number; pulse: number; starts: readonly number[] }>>

export type FeedbackName = keyof typeof haptics

const settings = { haptics: true, sound: true }

/** Turn touch or sound off for the whole app, e.g. from a settings screen. Both are on by default. */
export function configureFeedback(next: Partial<typeof settings>) {
  Object.assign(settings, next)
}

let audio: AudioContext | undefined

function beep(t: (typeof tones)[keyof typeof tones]) {
  const Ctx = typeof window !== "undefined" ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined
  if (!Ctx) return
  audio ??= new Ctx()
  if (audio.state === "suspended") void audio.resume().catch(() => {})
  const now = audio.currentTime
  for (const start of t.starts) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    const at = now + start / 1000
    const end = at + t.pulse / 1000
    osc.frequency.value = t.hz
    // A 10 ms ramp at each edge, so the pulse does not click.
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(0.3, at + 0.01)
    gain.gain.setValueAtTime(0.3, end - 0.01)
    gain.gain.linearRampToValueAtTime(0, end)
    osc.connect(gain).connect(audio.destination)
    osc.start(at)
    osc.stop(end)
  }
}

/** Play a moment's pattern: vibration where supported, and its tone if it has one. Silent where neither exists. */
export function feedback(name: FeedbackName) {
  if (settings.haptics && typeof navigator !== "undefined") navigator.vibrate?.([...haptics[name]])
  const tone = (tones as Partial<Record<FeedbackName, (typeof tones)[keyof typeof tones]>>)[name]
  if (settings.sound && tone) {
    try {
      beep(tone)
    } catch {
      // No audio device, or blocked: the screen still shows the alarm.
    }
  }
}
