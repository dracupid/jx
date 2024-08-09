import { $ } from 'bun'
import { exists } from 'jxtk/fs'
import path from 'path'
import { matchFiles } from '../lib/utils/file-tools'

const exts = ['*']
export async function run(args: { files: string[] | undefined }) {
  const files = await matchFiles(args.files, exts)
  for (const file of files) {
    const parsedPath = path.parse(file)
    parsedPath.base = ''
    parsedPath.name = parsedPath.name.trim()
    if (parsedPath.name.includes('(')) {
      parsedPath.name = parsedPath.name.slice(parsedPath.name.indexOf('('))
    }

    const num = /(\d+)/.exec(parsedPath.name)
    if (num) {
      parsedPath.name = Number.parseInt(num[1]!) + ''
      if (
        parsedPath.ext === '.mp4' ||
        parsedPath.ext === '.mov' ||
        parsedPath.ext === '.avi'
      ) {
        parsedPath.name = 'V' + parsedPath.name
      }
    }
    const newfile = path.format(parsedPath)
    if (file === newfile) continue
    if (await exists(newfile)) {
      throw new Error(`will overwrite file ${file} -> ${newfile}`)
    }
    await $`mv -n ${file} ${newfile}`
  }
}
