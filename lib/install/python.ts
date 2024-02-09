import { $ } from 'bun'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  jxDir,
  lnBin,
  type InstallOptions,
  type Installer,
} from '../Installer.js'

export default class PythonInstaller implements Installer {
  dependencies = ['miniconda']
  static DEFAULT_VERSION = '3.11'

  getPythonDir(version: string) {
    return path.join(jxDir, 'python', version)
  }
  isInstalled({
    version = PythonInstaller.DEFAULT_VERSION,
  }: Partial<InstallOptions>): Promise<boolean> {
    return Promise.resolve(existsSync(this.getPythonDir(version)))
  }
  async run({
    version = PythonInstaller.DEFAULT_VERSION,
  }: Partial<InstallOptions>): Promise<void> {
    const pythonDir = this.getPythonDir(version)
    await $`conda create -y -p ${pythonDir} python=${version}`
    await lnBin(
      path.join(pythonDir, 'bin', 'python' + version),
      'python' + version
    )
  }
}
