import { $, Glob, which } from 'bun'
import fs from 'fs/promises'
import { TaskRunner } from 'jxtk/async/TaskRunner.js'
import { ensureDir, exists } from 'jxtk/fs'
import { createLogger } from 'jxtk/log'
import os from 'os'
import path from 'path'
import { toSet } from '../../src/helpers'

const logger = createLogger('jx:ft')
const TRASH_DIR = '__Trash__'

export async function matchFiles(
  files: string | string[] | undefined,
  extnames: string[],
  filter?: (fullPath: string) => boolean
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
          if (!res.includes(TRASH_DIR)) {
            if (!filter || filter(res)) {
              results.add(res)
            }
          }
        }
      } else if (stat.isFile()) {
        const filePath = path.resolve(file)
        if (!filePath.includes(TRASH_DIR)) {
          results.add(filePath)
        }
      } else {
        console.error(`${file} is neither a dir or file.`)
      }
    })
  )
  return results
}

export function replaceExtname(extname: string, p: string) {
  return stem(p) + extname
}

export function stem(p: string) {
  return path.join(path.dirname(p), path.basename(p, path.extname(p)))
}

function prettySize(bytes: number) {
  if (bytes < 1000) {
    return `${bytes} B`
  }

  if (bytes < 1000 * 1000) {
    return `${(bytes / 1000).toFixed(1)} K`
  }

  if (bytes < 1000 * 1000 * 1000) {
    return `${(bytes / 1000 / 1000).toFixed(1)} M`
  }

  return `${(bytes / 1000 / 1000 / 1000).toFixed(1)} G`
}

async function moveToTrash(file: string) {
  const trashPath = path.join(path.dirname(file), TRASH_DIR)
  await ensureDir(trashPath)
  let trashFile = path.join(trashPath, path.basename(file))
  let i = 1
  while (await exists(trashFile)) {
    const extname = path.extname(file)
    trashFile = path.join(
      trashPath,
      path.basename(file, extname) + ` ${i++}` + extname
    )
  }
  await fs.rename(file, trashFile)
}

export const touchBin = which('touch') // bun shell 的 touch 不完整

export async function transformFiles(
  files: Set<string>,
  pathRemapper: (p: string) => string,
  transformer: (from: string, to: string) => void | Promise<void>,
  args: Partial<{
    concurrency: number
    remove: boolean
    trashRoot: string
  }> = {},
  postRun?: (from: string, to: string) => void | Promise<void>
) {
  const runner = new TaskRunner(args.concurrency ?? os.cpus().length - 1)

  await Promise.all(
    [...files].map(async (file) =>
      runner.add(async () => {
        const newPath = pathRemapper(file)
        if (!(await exists(newPath)) || (await fs.stat(newPath)).size === 0) {
          try {
            await transformer(file, newPath)
          } catch (e) {
            console.error(`ERROR [${file}]:`, e)
            process.exit(1)
          }
        }
        await $`${touchBin} -r ${file} ${newPath}`.quiet()

        await postRun?.(file, newPath)

        const [{ size: oldSize }, { size: newSize }] = await Promise.all([
          fs.stat(file),
          fs.stat(newPath),
        ])
        const percent = (newSize / oldSize) * 100

        const isBadCase = newSize >= oldSize

        if (isBadCase) {
          logger.error(
            `>> [${path.basename(file)}] ${prettySize(oldSize)} -> ${prettySize(newSize)} (${percent.toFixed(1)}%)\t${'>'.repeat(Math.ceil(percent / 10))}`
          )
          if (args.remove) {
            await moveToTrash(newPath)
          }
        } else {
          logger[percent < 15 ? 'info' : percent > 85 ? 'warn' : 'log'](
            `>> [${path.basename(file)}] ${prettySize(oldSize)} -> ${prettySize(newSize)} (${percent.toFixed(1)}%)\t${'>'.repeat(Math.ceil(percent / 10))}`
          )
          if (args.remove) {
            await moveToTrash(file)
          }
        }
      })
    )
  )
}
