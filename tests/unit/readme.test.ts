import { readFileSync, writeFileSync } from "node:fs"
import { expect, it } from "vitest"
import { readmeFrom } from "@/site/readme"

// README.md's counts and catalog tables come from the site's data (site/readme.ts). `npm run readme` rewrites them.
it("README.md lists every component and block as the site does", () => {
  const text = readFileSync("README.md", "utf8")
  const want = readmeFrom(text)
  if (process.env.WRITE_README) writeFileSync("README.md", want)
  else expect(text, "README.md is out of date with the catalog: run npm run readme").toBe(want)
})
