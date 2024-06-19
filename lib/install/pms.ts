import { $, which } from 'bun'
import { createLogger } from 'jxtk/log/index.js'
import { PLATFORM, platform } from '../utils/env.js'
import { lazyGet } from '../utils/object.js'
import type { Installer, PackageManager } from './Installer.js'

$.throws(true)
const logger = createLogger('jx:install')
class PackageManagerLoader {
  waitingList = new Set<string>()
  constructor(
    private readonly options: {
      name: string
      bin: string
      platforms: PLATFORM[]
      load: () => Promise<PackageManager>
    }
  ) {}

  canUse = lazyGet<boolean>(
    () =>
      this.options.platforms.includes(platform()) && !!which(this.options.bin)
  )

  add(name: string) {
    this.waitingList.add(name)
  }

  async load() {
    return this.options.load()
  }

  async run() {
    if (this.waitingList.size > 0) {
      const pm = await this.load()
      $.throws(true)
      await $`${this.options.bin} ${pm.getInstallArgs(this.waitingList)}`
      this.waitingList.clear()
    }
  }
}

export const PMS = {
  apt: new PackageManagerLoader({
    name: 'apt',
    bin: 'apt-get',
    platforms: [PLATFORM.Linux],
    async load() {
      return (await import('./pms/apt.js')).default
    },
  }),

  homebrew: new PackageManagerLoader({
    name: 'homebrew',
    bin: 'brew',
    platforms: [PLATFORM.Linux, PLATFORM.Mac],
    async load() {
      return (await import('./pms/homebrew.js')).default
    },
  }),

  dnf: new PackageManagerLoader({
    name: 'dnf',
    bin: 'dnf',
    platforms: [PLATFORM.Linux],
    async load() {
      return (await import('./pms/dnf.js')).default
    },
  }),
} satisfies Record<string, PackageManagerLoader>

type PMName = keyof typeof PMS

export async function createInstaller(
  binName: string,
  pms: PMName[],
  alias: Partial<Record<PMName, string>> = {}
): Promise<Installer> {
  const res = pms
    .map((pmName) => {
      return { loader: PMS[pmName], name: alias[pmName] || binName }
    })
    .find(({ loader }) => loader.canUse())

  if (!res) {
    logger.fatal(`install ${binName} failed, none of ${pms.join('/')} is found`)
    process.exit(1)
  }
  await res.loader.load()

  res.loader.add(res.name)

  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    async isInstalled() {
      return !!which(binName)
    },
    async run() {
      return res.loader.run()
    },
  }
}
