// The prompt a Prompt button copies, apart from site/ai.ts so a client component can write it: a page of twenty blocks
// sends each block's name and the site's address, not twenty copies of the same five lines.

/** A prompt that hands an agent this item: what to install and where its rules are. `origin` is the site's address. */
export const promptFor = (origin: string, title: string, path: string, name: string) =>
  [
    `Use the SYNCROBOTIC ${title} (@syncrobotic/${name}) in this project.`,
    `1. Install it: npx shadcn add @syncrobotic/${name}`,
    `2. Read ${origin}${path}.md and follow its rules and agent notes; the design language is in ${origin}/llms-full.txt.`,
    "3. Keep its structure and tokens; replace only the sample data. Do not invent props: read the installed source.",
    "4. Check: tokens only, 44 px targets on touch, colour only for abnormal states, every duration class with ease-(--ease-standard) beside it; leaving uses the exit animations (animate-disappear, sheet-out, collapse), which carry --ease-exit.",
  ].join("\n")
