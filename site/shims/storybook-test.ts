// Stand-in for @storybook/test on the docs site: story callbacks do nothing.
export function fn<T extends (...args: never[]) => unknown>(impl?: T): T {
  return (impl ?? (() => undefined)) as T
}
