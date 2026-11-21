// Code correctness only: the React rules of hooks and TypeScript's recommended rules. The design rules (tokens, motion,
// focus, charts) have their own checks in scripts/; formatting is not linted.
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  { ignores: [".claude", "node_modules", ".next", "public", "storybook-static", "test-results", "playwright-report", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
)
