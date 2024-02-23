import { $ } from 'bun'
import { jxExists, jxJoin, lnBinDir, type Installer } from '../Installer.ts'

export default {
  async isInstalled() {
    return jxExists('/', 'rust')
  },
  async run() {
    let script = await (await fetch('https://sh.rustup.rs')).text()
    await $`sh -c ${script} -- -y --no-modify-path`.env({
      RUSTUP_HOME: jxJoin('/', 'rust', 'rustup'),
      CARGO_HOME: jxJoin('/', 'rust', 'cargo'),
    })
    await lnBinDir(jxJoin('/', 'rust', 'cargo', 'bin'), 'cargo')
  },
} satisfies Installer
