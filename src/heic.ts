import { $ } from 'bun'
import os from 'os'
import {
  matchFiles,
  replaceExtname,
  transformFiles,
} from '../lib/utils/file-tools'

const exts = [
  'jpg',
  'png',
  'jpeg',
  'bmp',
  'tiff',
  'jfif',
  'webp',
  'RAF',
  'avif',
]
export async function run(args: {
  remove: boolean
  files: string[] | undefined
  minor: boolean
  forceJpg: boolean
}) {
  const files = await matchFiles(
    args.files,
    exts,
    (p) => !p.endsWith('.heic.jpg')
  )
  await transformFiles(
    files,
    replaceExtname.bind(
      undefined,
      args.minor
        ? args.forceJpg
          ? '.m.heic.jpg'
          : '.m.heic'
        : args.forceJpg
          ? '.heic.jpg'
          : '.heic'
    ),
    async (oldPath, newPath) => {
      await $`sips -s format heic ${oldPath} -s formatOptions ${args.minor ? 50 : 60} --out ${newPath}`.quiet()
    },
    { ...args, concurrency: os.cpus().length - 2 }
  )
}
