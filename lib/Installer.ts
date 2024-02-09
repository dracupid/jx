import { file } from 'bun'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
export interface InstallOptions {
  version: string
}

export interface Installer {
  dependencies?: string[]
  run(options: Partial<InstallOptions>): Promise<void>
  isInstalled(options: Partial<InstallOptions>): Promise<boolean>
}

export const jxDir = path.join(os.homedir(), '.jx')
export const binDir = path.join(jxDir, 'bin')
export const cacheDir = path.join(jxDir, 'cache')

export async function lnBin(src: string, name: string) {
  console.log(`>> add ${src} to ${binDir} as ${name}`)
  const dist = path.join(binDir, name)
  if (await file(dist).exists()) {
    await fs.unlink(dist)
  }
  await fs.symlink(src, dist)
}
