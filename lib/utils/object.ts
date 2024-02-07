export function lazyGet<T>(getter: () => T): () => T {
  let obj: T | undefined
  return () => {
    if (obj === undefined) {
      obj = getter()
    }
    return obj
  }
}

export function isClass(v: unknown) {
  return v instanceof Function && v?.constructor?.name === 'Function'
}
