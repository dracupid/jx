export function toSet(option: string | string[]) {
  if (Array.isArray(option)) {
    return new Set(option)
  }
  return new Set([option])
}
