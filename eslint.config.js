// Code correctness only: the React rules of hooks and TypeScript's recommended rules. The design rules (tokens, motion,
// focus, charts) have their own checks in scripts/; formatting is not linted.
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"

export default tseslint.config(
  { ignores: [".claude", "node_modules", ".next", "public", "storybook-static", "test-results", "playwright-report", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    rules: {
      // A leading underscore marks a value that is left out on purpose (a skipped tuple slot, a rest-sibling).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  // The registry, with types: a promise is never dropped, nor handed to an event that ignores what it returns. A rejected
  // passkey prompt (cancelled) once left a sign-in button waiting for good; a handler awaits inside and catches, and is
  // passed as `() => void run()`.
  {
    files: ["registry/**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: { "@typescript-eslint/no-floating-promises": "error", "@typescript-eslint/no-misused-promises": "error" },
  },
  // The browser scripts are CommonJS: Playwright is required from wherever it is installed.
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
)
