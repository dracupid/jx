import { $ } from 'bun'
import { jxExists, jxJoin, lnBin, type Installer } from '../Installer.js'

const DIR_NAME = 'python'

export default {
  dependencies: ['miniconda'],
  async isInstalled({ version }) {
    return jxExists('/', DIR_NAME, version)
  },
  async run({ version }) {
    const pythonDir = ['/', DIR_NAME, version] as const
    $.throws(true)
    await $`conda create -y -p ${jxJoin(...pythonDir)} python=${version}`
    await lnBin(
      jxJoin(...pythonDir, 'bin', 'python' + version),
      'python' + version
    )
  },
} satisfies Installer
