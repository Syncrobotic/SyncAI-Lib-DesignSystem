// Modules that vitest.config.ts compiles with the React Compiler when a test imports them with these queries. Each
// exports what the file itself exports.
declare module "@/registry/syncrobotic/ui/data-grid?react-compiler" {
  export * from "@/registry/syncrobotic/ui/data-grid"
}
declare module "@/registry/syncrobotic/ui/data-grid?react-compiler&without-directive" {
  export * from "@/registry/syncrobotic/ui/data-grid"
}
