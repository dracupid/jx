import { ensureDir, exists } from 'jxtk/fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export interface InstallOptions {
  version: string
}

export interface Installer {
  dependencies?: string[]
  run(options: InstallOptions): Promise<void>
  isInstalled(options: InstallOptions): Promise<boolean>
}

export interface PackageManager {
  getInstallArgs(pkgList: Set<string>): string[]
}

export const jxDir = path.join(os.homedir(), '.jx')
export const binDir = path.join(jxDir, 'bin')
export const binsDir = path.join(jxDir, 'bins')
export const cacheDir = path.join(jxDir, 'cache')

type JxRoot = '/' | 'cache' | 'bin'

export async function lnBin(src: string, name: string) {
  console.info(`>> add ${src} to ${binDir} as ${name}`)
  const dist = path.join(binDir, name)
  await ensureDir(binDir)
  if (await exists(dist)) {
    await fs.unlink(dist)
  }
  await fs.symlink(src, dist)
}

export async function lnBinDir(src: string, name: string) {
  console.info(`>> add dir ${src} to ${binsDir} as ${name}`)
  const dist = path.join(binsDir, name)
  await ensureDir(binsDir)
  if (await exists(dist)) {
    await fs.unlink(dist)
  }
  await fs.symlink(src, dist, 'dir')
}

export function jxJoin(root: JxRoot | '' = '/', ...subDirs: string[]) {
  if (root === '') {
    return path.join(...subDirs)
  }
  return root === '/'
    ? path.join(jxDir, ...subDirs)
    : path.join(jxDir, root, ...subDirs)
}

export async function jxExists(root: JxRoot | '' = '/', ...subDirs: string[]) {
  return exists(jxJoin(root, ...subDirs))
}
