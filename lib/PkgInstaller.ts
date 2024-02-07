import { $, which } from 'bun'
import os from 'os'
import { lazyGet } from './utils/object'

interface PackageManager {
  name: string
  platform: string[]
  bin: string
  packages: string[]
  getInstallArgs(pkgName: Set<string>): string[]
}

const apt: PackageManager = {
  name: 'apt',
  platform: ['linux'],
  bin: 'apt-get',
  getInstallArgs(pkgList: Set<string>) {
    return ['install', '-y', '--no-install-recommends', ...pkgList]
  },
  packages: ['git', 'zsh'],
}

const homebrew: PackageManager = {
  name: 'homebrew',
  platform: ['darwin', 'linux'],
  bin: 'brew',
  getInstallArgs(pkgList: Set<string>) {
    return ['install', ...pkgList]
  },
  packages: ['git', 'zsh'],
}

const packageManagers = [apt, homebrew]

export const getPkgManagerContext = lazyGet<{
  support: (name: string) => boolean
  add: (name: string) => void
  run: () => Promise<void>
} | null>(() => {
  const platform = os.platform()
  const matched = packageManagers.filter((pkg) =>
    pkg.platform.includes(platform)
  )
  for (const it of matched) {
    if (which(it.bin)) {
      const toBeInstalled = new Set<string>()
      return {
        support(name) {
          return it.packages.includes(name)
        },
        add(name) {
          toBeInstalled.add(name)
        },
        async run() {
          if (toBeInstalled.size > 0) {
            await $`${it.bin} ${it.getInstallArgs(toBeInstalled) as any}` // array type missing by bun
            toBeInstalled.clear()
          }
        },
      }
    }
  }
  return null
})
