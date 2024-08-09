import { $ } from 'bun'
import {
  matchFiles,
  replaceExtname,
  transformFiles,
} from '../lib/utils/file-tools'

const exts = ['jpg', 'png', 'jpeg', 'bmp', 'tiff', 'jfif', 'webp']
export async function run(args: {
  remove: boolean
  files: string[] | undefined
}) {
  const files = await matchFiles(args.files, exts)
  await transformFiles(
    files,
    replaceExtname.bind(undefined, '_2.heic'),
    async (oldPath, newPath) => {
      console.log(oldPath, newPath)
      await $`heif-enc ${oldPath} -q 50 -o ${newPath} -p x265:preset=veryfast --benchmark` //.quiet()
    },
    { concurrency: 1 }
  )
}
