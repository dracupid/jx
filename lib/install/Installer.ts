import { file } from 'bun'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { exists } from '../utils/fs'

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
export const cacheDir = path.join(jxDir, 'cache')

type JxRoot = '/' | 'cache' | 'bin'

export async function lnBin(src: string, name: string) {
  console.info(`>> add ${src} to ${binDir} as ${name}`)
  const dist = path.join(binDir, name)
  if (await file(dist).exists()) {
    await fs.unlink(dist)
  }
  await fs.symlink(src, dist)
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
