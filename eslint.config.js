// Code correctness only: the React rules of hooks and TypeScript's recommended rules. The design rules (tokens, motion,
// focus, charts) have their own checks in scripts/; formatting is not linted.
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import jsxA11y from "eslint-plugin-jsx-a11y"
import { fixupPluginRules } from "@eslint/compat"

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
  // Accessibility in the markup itself (roles, ARIA, keyboard for what is clickable), before anything renders; axe on the
  // built pages (check:a11y) covers what only shows once it does. The plugin's peer range stops at ESLint 9; the compat
  // layer adapts its rules to 10 (package.json overrides the peer range).
  {
    files: ["**/*.tsx"],
    plugins: { "jsx-a11y": fixupPluginRules(jsxA11y) },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // A component's own `role` prop (a chat Message's "system") is not an ARIA role.
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],
      // role="list" on a ul/ol is not redundant here: Tailwind's reset sets list-style: none, and Safari's VoiceOver then
      // drops the list semantics unless the role is given back. (nav keeps the rule's own default exception.)
      "jsx-a11y/no-redundant-roles": ["error", { nav: ["navigation"], ul: ["list"], ol: ["list"] }],
      // The kit's Checkbox, Switch and RadioGroupItem render a native <button> (Radix), which a wrapping <label> names; a
      // label's text may sit in a title-and-description pair of spans, one level deeper than the rule looks by default.
      "jsx-a11y/label-has-associated-control": ["error", { controlComponents: ["Checkbox", "Switch", "RadioGroupItem"], depth: 3 }],
    },
  },
  // Tests render fixtures (a bare `<a {...props} />` stand-in for a router link, a click-capturing wrapper div), not
  // markup that ships; axe on the rendered components and the rules above on registry/ cover what does.
  {
    files: ["tests/**/*.tsx"],
    rules: Object.fromEntries(Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "off"])),
  },
  // The browser scripts are CommonJS: Playwright is required from wherever it is installed.
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
)
