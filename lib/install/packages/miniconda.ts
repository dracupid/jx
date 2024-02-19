import { $ } from 'bun'
import { ARCH, PLATFORM, arch, platform } from '../../utils/env.js'
import { download } from '../../utils/network.js'
import { jxExists, jxJoin, lnBin, type Installer } from '../Installer.js'

const platformMap: Record<PLATFORM, string> = {
  [PLATFORM.Linux]: 'Linux',
  [PLATFORM.Mac]: 'MacOSX',
}

const archMap: Record<ARCH, string> = {
  [ARCH.ARM64]: 'arm64',
  [ARCH.X64]: 'x86_64',
}

const DIR_NAME = 'miniconda'

export default {
  async isInstalled() {
    return jxExists('/', DIR_NAME)
  },
  async run({ version }) {
    const url = `https://repo.anaconda.com/miniconda/Miniconda3-${version}-${platformMap[platform()]}-${archMap[arch()]}.sh`
    const scriptPath = jxJoin('cache', `miniconda-${version}.sh`)
    $.throws(true)
    await download(url, scriptPath)
    await $`bash ${scriptPath} -b -u -p ${jxJoin('/', DIR_NAME)}`
    await lnBin(jxJoin('/', DIR_NAME, 'bin', 'conda'), 'conda')
  },
} satisfies Installer
