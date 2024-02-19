import type { PathLike } from 'fs'
import fsP from 'fs/promises'

export async function exists(path: PathLike) {
  return fsP.access(path).then(
    () => true,
    () => false
  )
}
