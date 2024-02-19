export function lazyGet<T>(getter: () => T): () => T {
  let obj: T | undefined
  return () => {
    if (typeof obj === 'undefined') {
      obj = getter()
    }
    return obj
  }
}
