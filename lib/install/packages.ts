import type { InstallOptions, Installer } from './Installer.js'
import { createInstaller } from './pms.js'

interface JxInstallerLoader {
  alias?: string[]
  options?: InstallOptions
  load: () => Promise<Installer>
}

export const loaders: Record<string, JxInstallerLoader> = {
  miniconda: {
    alias: ['conda'],
    options: {
      version: 'py311_23.11.0-2',
    },
    async load() {
      return (await import('./packages/miniconda')).default
    },
  },
  python: {
    options: {
      version: '3.11',
    },
    async load() {
      return (await import('./packages/python')).default
    },
  },
  'oh-my-zsh': {
    alias: ['omz'],
    async load() {
      return (await import('./packages/oh-my-zsh')).default
    },
  },
  rust: {
    async load() {
      return (await import('./packages/rust')).default
    },
  },
  git: {
    async load() {
      return createInstaller('git', ['apt', 'homebrew'])
    },
  },
  zsh: {
    async load() {
      return createInstaller('zsh', ['apt', 'homebrew'])
    },
  },
}

// expand aliases
Object.values(loaders).forEach((it) => {
  if (it.alias) {
    it.alias.forEach((name) => {
      loaders[name] = it
    })
  }
})

export interface Pacakge {
  name: string
  version: string
  installer: Installer
}

export async function formatPackages(_pkgs: string[]) {
  const pkgs = new Set(_pkgs)
  const unknown = new Set<string>()
  const installed = new Set<string>()
  const notInstalled: Pacakge[] = []
  for (const pkg of pkgs) {
    const [name, version] = pkg.split('@')
    const loader = loaders[name]
    if (!loader) {
      unknown.add(pkg)
    } else {
      const installer = await loader.load()
      if (await installer.isInstalled({ version })) {
        installed.add(pkg)
      } else {
        notInstalled.push({
          name,
          version: version || loader.options?.version || '',
          installer,
        })
      }
    }
  }
  return { unknown, installed, notInstalled }
}
