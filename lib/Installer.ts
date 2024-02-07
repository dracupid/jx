export interface Installer {
  dependencies?: string[]
  run(): Promise<void>
}

export function runInstall(installer: Installer) {
  installer.run()
}
