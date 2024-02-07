import { file } from 'bun'
import chalk from 'chalk'
import { program } from 'commander'
import path from 'path'
import { Installer } from '../lib/Installer'
import { getPkgManagerContext } from '../lib/PkgInstaller'

program.argument('<names...>', 'one or more package names')
program.parse(process.argv)

async function getRunner(
  name: string
): Promise<{ run?: () => Promise<void>; name: string }> {
  const customPath = path.join(import.meta.dir, '../lib/install', name + '.ts')
  if (await file(customPath).exists()) {
    const exp = await import(customPath)
    const installer = new exp.default() as Installer
    return {
      name,
      run: async () => {
        await runInstall(installer.dependencies)
        await installer.run()
      },
    }
  }
  const pkgManagerCtx = getPkgManagerContext()
  if (pkgManagerCtx?.support(name)) {
    pkgManagerCtx.add(name)
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
