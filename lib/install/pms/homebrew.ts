import type { PackageManager } from '../Installer'

export default {
  getInstallArgs(pkgList: Set<string>) {
    return ['install', ...pkgList]
  },
} satisfies PackageManager
