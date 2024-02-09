import { $ } from 'bun'
import { existsSync } from 'node:fs'
import path from 'path'
import {
  cacheDir,
  jxDir,
  lnBin,
  type InstallOptions,
  type Installer,
} from '../Installer.js'
import { ARCH, PLATFORM, arch, platform } from '../utils/env.js'
import { download } from '../utils/network.js'

const platformMap: Record<PLATFORM, string> = {
  [PLATFORM.Linux]: 'Linux',
  [PLATFORM.Mac]: 'MacOSX',
}

const archMap: Record<ARCH, string> = {
  [ARCH.ARM64]: 'arm64',
  [ARCH.X64]: 'x86_64',
}

export default class MiniCondaInstaller implements Installer {
  condaDir = path.join(jxDir, 'miniconda')
  condaBin = path.join(this.condaDir, 'bin', 'conda')
  getInstallScript(version = 'latest') {
    return `https://repo.anaconda.com/miniconda/Miniconda3-${version}-${platformMap[platform()]}-${archMap[arch()]}.sh`
  }
  isInstalled(): Promise<boolean> {
    return Promise.resolve(existsSync(this.condaBin))
  }
  async run({ version }: Partial<InstallOptions>) {
    const url = this.getInstallScript(version)
    const scriptPath = path.join(cacheDir, 'miniconda.sh')
    await download(url, scriptPath)
    await $`bash ${scriptPath} -b -u -p ${this.condaDir}`
    await lnBin(this.condaBin, 'conda')
  }
}
