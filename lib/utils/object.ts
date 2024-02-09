export function lazyGet<T>(getter: () => T): () => T {
  let obj: T | undefined
  return () => {
    if (obj === undefined) {
      obj = getter()
    }
    return obj
  }
}
