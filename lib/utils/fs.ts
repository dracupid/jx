import type { PathLike } from 'fs'
import fsP from 'fs/promises'

export async function exists(path: PathLike) {
  return fsP.access(path).then(
    () => true,
    () => false
  )
}

export async function ensureDir(path: PathLike, mode = 0o777) {
  return fsP.mkdir(path, {
    mode,
    recursive: true,
  })
}
