import { $, file } from 'bun'
import { createLogger } from 'jtk/log'
import { existsSync } from 'node:fs'
import os from 'os'
import path from 'path'
import { jxExists, type Installer } from '../Installer'

const logger = createLogger('jx:install:omz')

async function installOhMyZsh(omzDir: string) {
  let script = await (
    await fetch(
      'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh'
    )
  ).text()

  // force color output
  script = script.replace(/is_tty\(\)\s*{\s*false\s*}/, 'is_tty() {\n true \n}')

  await $`sh -c ${script} -- --unattended`.env({
    ZSH: omzDir,
  })
}

async function installHighlight(dir: string) {
  await $`git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${dir}`
}

async function updateZshrc(zshrcPath: string) {
  if (!existsSync(zshrcPath)) {
    logger.error(zshrcPath + ' not found')
    return
  }
  const zshrcFile = file(zshrcPath)

  const zshrc = await zshrcFile.text()
  const newZshrc = zshrc
    .replace(/(^ZSH_THEME=")(\w+)(")/m, (_, p1, __, p2) => `${p1}ys${p2}`)
    .replace(/^(plugins=\()([^)]*)(\))/m, (_, p1, plugins: string, p2) => {
      const pluginList = new Set(plugins.split(/\s+/))
      pluginList.add('zsh-syntax-highlighting')
      return `${p1}${[...pluginList].join(' ')}${p2}`
    })

  if (zshrc !== newZshrc) {
    const bakPath = zshrcPath + `.${Date.now()}.jx_bak`
    await Bun.write(bakPath, zshrcFile)
    logger.log(`backup .zshrc to ${bakPath}`)
  }
  await Bun.write(zshrcFile, newZshrc)
}

const OMZ_DIR = process.env.ZSH || path.join(os.homedir(), '.oh-my-zsh')

export default {
  dependencies: ['git', 'zsh'],
  async isInstalled() {
    return jxExists('', OMZ_DIR)
  },
  async run() {
    await installOhMyZsh(OMZ_DIR)

    const zshCustomDir = process.env.ZSH_CUSTOM || path.join(OMZ_DIR, 'custom')
    const highlightingPluginDir = `${zshCustomDir}/plugins/zsh-syntax-highlighting`

    if (!existsSync(highlightingPluginDir)) {
      await installHighlight(highlightingPluginDir)
    }

    await updateZshrc(path.join(os.homedir(), '.zshrc'))
  },
} satisfies Installer
