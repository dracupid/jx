import type { PackageManager } from '../Installer'

export default {
  getInstallArgs(pkgList: Set<string>) {
    return ['install', '-y', '--setopt=install_weak_deps=False', ...pkgList]
  },
} satisfies PackageManager
