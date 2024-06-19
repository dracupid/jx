import { $, Glob, which } from 'bun'
import fs from 'fs/promises'
import { TaskRunner } from 'jxtk/async/TaskRunner.js'
import { ensureDir, exists } from 'jxtk/fs'
import { createLogger } from 'jxtk/log'
import os from 'os'
import path from 'path'
import { toSet } from '../../src/helpers'

const logger = createLogger('jx:ft')

export async function matchFiles(
  files: string | string[] | undefined,
  extnames: string[]
) {
  const fileSet = toSet(files)
  if (fileSet.size === 0) {
    fileSet.add(process.cwd())
  }

  const extSet = new Set<string>()
  for (const ext of extnames) {
    extSet.add(ext)
    extSet.add(ext.toLowerCase())
    extSet.add(ext.toUpperCase())
  }

  const glob = new Glob(`**/*.{${[...extSet].join(',')}}`)

  const results = new Set<string>()
  await Promise.all(
    [...fileSet].map(async (file) => {
      const stat = await fs.stat(file)
      if (stat.isDirectory()) {
        const scanResult = glob.scan({
          cwd: file,
          absolute: true,
          onlyFiles: true,
        })
        for await (const res of scanResult) {
          results.add(res)
        }
      } else if (stat.isFile()) {
        results.add(path.resolve(file))
      } else {
        console.error(`${file} is neither a dir or file.`)
      }
    })
  )
  return results
}

export function replaceExtname(extname: string, p: string) {
  return path.join(path.dirname(p), path.basename(p, path.extname(p)) + extname)
}

function prettySize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} K`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} M`
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} G`
}

const TRASH_DIR = '__Trash__'

async function moveToTrash(file: string) {
  await ensureDir(TRASH_DIR)
  let trashFile = path.join(TRASH_DIR, path.basename(file))
  let i = 1
  while (await exists(trashFile)) {
    trashFile = path.join(TRASH_DIR, path.basename(file) + ` ${i++}`)
  }
  await fs.rename(file, trashFile)
}

export async function transformFiles(
  files: Set<string>,
  pathRemapper: (p: string) => string,
  transformer: (from: string, to: string) => void | Promise<void>,
  args: Partial<{ concurrency: number; remove: boolean }> = {}
) {
  const runner = new TaskRunner(args.concurrency ?? os.cpus().length)
  const touchBin = which('touch') // bun shell 的 touch 不完整

  await Promise.all(
    [...files].map(async (file) =>
      runner.add(async () => {
        const newPath = pathRemapper(file)
        if (!(await exists(newPath))) {
          await transformer(file, newPath)
        }
        await $`${touchBin} -r ${newPath} ${file}`.quiet()

        const [{ size: oldSize }, { size: newSize }] = await Promise.all([
          fs.stat(file),
          fs.stat(newPath),
        ])
        const percent = ((oldSize - newSize) / oldSize) * 100

        const isBadCase = newSize >= oldSize

        if (isBadCase) {
          logger.warn(
            `>> [${path.basename(file)}] ${prettySize(oldSize)} -> ${prettySize(newSize)}(+${Math.abs(percent).toFixed(1)}%)`
          )
          if (args.remove) {
            await moveToTrash(newPath)
          }
        } else {
          logger.log(
            `>> [${path.basename(file)}] ${prettySize(oldSize)} -> ${prettySize(newSize)}(-${percent.toFixed(1)}%)`
          )
          if (args.remove) {
            await moveToTrash(file)
          }
        }
      })
    )
  )
}
