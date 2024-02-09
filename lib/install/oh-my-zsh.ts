import { $, file } from 'bun'
import chalk from 'chalk'
import { existsSync } from 'node:fs'
import os from 'os'
import path from 'path'
import { type Installer } from '../Installer.ts'

export default class OhMyZshInstaller implements Installer {
  dependencies = ['git', 'zsh']
  omzDir = process.env.ZSH || path.join(os.homedir(), '.oh-my-zsh')

  async installOhMyZsh(omzDir: string) {
    let script = await (
      await fetch(
        'https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh'
      )
    ).text()

    // force color required by zx
    script = script.replace(
      /is_tty\(\)\s*\{\s*false\s*\}/,
      'is_tty() {\n true \n}'
    )

    await $`sh -c ${script} -- --unattended`.env({
      ZSH: omzDir,
    })
  }

  async installHighlight(dir: string) {
    await $`git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${dir}`
  }

  async updateZshrc(zshrcPath: string) {
    if (!existsSync(zshrcPath)) {
      console.error(chalk.red(zshrcPath + ' not found'))
      return
    }
    const zshrcFile = file(zshrcPath)

    let zshrc = await zshrcFile.text()
    const newZshrc = zshrc
      .replace(/(^ZSH_THEME=")(\w+)(")/m, (_, p1, __, p2) => {
        return `${p1}ys${p2}`
      })
      .replace(/^(plugins=\()([^\)]*)(\))/m, (_, p1, plugins, p2) => {
        const pluginList = new Set(plugins.split(/\s+/))
        pluginList.add('zsh-syntax-highlighting')
        return `${p1}${[...pluginList].join(' ')}${p2}`
      })

    if (zshrc !== newZshrc) {
      const bakPath = zshrcPath + `.${Date.now()}.jx_bak`
      await Bun.write(bakPath, zshrcFile)
      console.log(`backup .zshrc to ${bakPath}`)
    }
    await Bun.write(zshrcFile, newZshrc)
  }

  isInstalled(): Promise<boolean> {
    return Promise.resolve(existsSync(this.omzDir))
  }

  async run() {
    await this.installOhMyZsh(this.omzDir)

    const zshCustomDir =
      process.env.ZSH_CUSTOM || path.join(this.omzDir, 'custom')
    const highlightingPluginDir = `${zshCustomDir}/plugins/zsh-syntax-highlighting`
    if (!existsSync(highlightingPluginDir)) {
      await this.installHighlight(highlightingPluginDir)
    }

    await this.updateZshrc(path.join(os.homedir(), '.zshrc'))
  }
}
