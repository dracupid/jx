import type { PackageManager } from '../Installer'

export default {
  getInstallArgs(pkgList: Set<string>) {
    return ['install', '-y', '--no-install-recommends', ...pkgList]
  },
} satisfies PackageManager
