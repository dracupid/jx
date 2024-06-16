export function toSet(option: string | string[] | undefined) {
  if (!option) {
    return new Set<string>()
  } else if (Array.isArray(option)) {
    return new Set(option)
  }
  return new Set([option])
}
