import { file } from 'bun'
import chalk from 'chalk'
import { program } from 'commander'
import path from 'path'
import { type Installer } from '../lib/Installer.js'
import { getPkgManagerContext } from '../lib/PkgInstaller.js'

program.argument('<names...>', 'one or more package names')
program.parse(process.argv)

async function getRunner(
  _name: string
): Promise<{ run?: () => Promise<void>; name: string }> {
  const [name, version] = _name.split('@')
  const customPath = path.join(import.meta.dir, '../lib/install', name + '.ts')
  if (await file(customPath).exists()) {
    const exp = await import(customPath)
    const installer = new exp.default() as Installer
    return {
      name,
      run: async () => {
        if (await installer.isInstalled({ version })) {
          console.log(chalk.yellow(`[jx] ${_name} already installed.`))
        } else {
          await runInstall(installer.dependencies)
          await installer.run({ version })
        }
      },
    }
  }
  const pkgManagerCtx = getPkgManagerContext()
  if (pkgManagerCtx?.support(name)) {
    if (await pkgManagerCtx.isInstalled(name)) {
      console.log(chalk.yellow(`[jx] ${_name} already installed.`))
    } else {
      pkgManagerCtx.add(name, version)
    }
    return { name, run: pkgManagerCtx.run }
  }

  return { name }
}

async function runInstall(packages?: string[]) {
  if (!packages || packages.length === 0) return
  const runners = await Promise.all(packages.map(getRunner))
  const unknownPackages = runners.filter((r) => !r.run).map((r) => r.name)
  if (unknownPackages.length > 0) {
    console.error(
      chalk.red(`unknown package(s): ${unknownPackages.join(', ')}`)
    )
    process.exit(1)
  }
  console.log(chalk.green(`installing ${packages}...`))
  for (const runner of runners) {
    await runner.run!()
  }
}

await runInstall([...new Set(program.args)])
