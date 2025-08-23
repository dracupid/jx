import { $ } from 'bun'
import { exists } from 'jxtk/fs'
import path from 'path'
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
  'heic',
  'gif',
]
export async function run(args: {
  remove: boolean
  files: string[] | undefined
  svt: boolean
}) {
  const bin = path.join(import.meta.dir, 'heif-enc')
  const files = await matchFiles(
    args.files,
    exts,
    (p) => !p.endsWith('.temp.jpg')
  )

  await transformFiles(
    files,
    (p: string) =>
      p.endsWith('.gif')
        ? replaceExtname('-gif.avif', p)
        : args.svt
          ? replaceExtname('.svt.avif', p)
          : replaceExtname('.avif', p),
    async (oldPath, newPath) => {
      if (oldPath.endsWith('.gif')) {
        const args = [
          '-copyts',
          ['-movflags', 'use_metadata_tags'],
          ['-map_metadata', '0'],
          ['-cpu-used', '6'],
          ['-row-mt', '1'],
          ['-c:v', 'libaom-av1'],
          ['-crf', '32'],
          ['-fps_mode', 'passthrough'],
        ].flat()
        await $`ffmpeg -noautorotate -hwaccel videotoolbox -i ${oldPath} ${args} ${newPath}`.env(
          {
            AV_LOG_FORCE_COLOR: '3',
          }
        )
        return
      }
      let tmpPath = ''
      if (oldPath.endsWith('.heic')) {
        tmpPath = `${oldPath}.temp.jpg`
        await $`heif-dec ${oldPath} -q 100 -o ${tmpPath}`.quiet()
      } else if (oldPath.endsWith('.webp')) {
        tmpPath = `${oldPath}.temp.jpg`
        await $`magick ${oldPath} -quality 100 ${tmpPath}`.quiet()
      }

      // eslint-disable-next-line unicorn/prefer-ternary
      if (args.svt) {
        await $`${bin} ${tmpPath || oldPath} -q 75 -e svt -p speed=4 -p qp=30 -o ${newPath} --benchmark` //.quiet()
      } else {
        await $`${bin} ${tmpPath || oldPath} -q 75 -p threads=1 -o ${newPath} --benchmark` //.quiet()
      }

      if (tmpPath) {
        await $`rm ${tmpPath}`
      }
    },
    args,
    async (oldPath) => {
      const tmpPath = `${oldPath}.temp.jpg`
      if (await exists(tmpPath)) {
        await $`rm ${tmpPath}`
      }
    }
  )
}
