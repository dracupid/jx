import { $ } from 'bun'
import {
  matchFiles,
  replaceExtname,
  transformFiles,
} from '../lib/utils/file-tools'

const exts = ['jpg', 'png', 'jpeg', 'bmp', 'tiff', 'jfif']
export async function run(args: {
  remove: boolean
  files: string[] | undefined
}) {
  const files = await matchFiles(args.files, exts)
  await transformFiles(
    files,
    replaceExtname.bind(undefined, '.heic'),
    async (oldPath, newPath) => {
      await $`sips -s format heic ${oldPath} --out ${newPath}`.quiet()
    },
    args
  )
}
