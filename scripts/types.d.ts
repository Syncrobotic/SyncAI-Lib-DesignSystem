// The shapes the CI scripts read from registry.json and write to their lock files. The scripts are plain JavaScript; they
// name these types in JSDoc (import("./types.js")) so `npm run typecheck` checks them against the data they handle.

export type RegistryFile = { path: string; type: string; target?: string }

export type ChangelogEntry = { version: string; date: string; note: string }

export type RegistryItem = {
  name: string
  type: string
  title?: string
  description?: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  meta?: {
    version?: string
    status?: string
    changelog?: ChangelogEntry[]
    examples?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type Registry = { items: RegistryItem[]; [key: string]: unknown }

/** registry/versions.lock.json: the version and content hash each item shipped with. */
export type VersionsLock = Record<string, { version: string; hash: string }>
