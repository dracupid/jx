import { $, which } from 'bun'
import type { Installer } from '../Installer'

export default {
  // eslint-disable-next-line @typescript-eslint/require-await
  async isInstalled() {
    return !!which('brew')
  },
  async run() {
    const script = await (
      await fetch(
        'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh'
      )
    ).text()
    await $`bash -c ${script}`
  },
} satisfies Installer
