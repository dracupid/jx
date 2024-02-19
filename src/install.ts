import chalk from 'chalk'
import { program } from 'commander'
import { formatPackages } from '../lib/install/packages.js'

program.argument('<names...>', 'one or more package names')
program.parse(process.argv)

async function runInstall(packages?: string[]) {
  if (!packages || packages.length === 0) return

  const { installed, unknown, notInstalled } = await formatPackages(packages)

  if (unknown.size > 0) {
    console.error(chalk.red(`unknown package(s): ${[...unknown].join(', ')}`))
    process.exit(1)
  }

  if (installed.size > 0) {
    console.log(
      chalk.yellow(`[jx] ${[...installed].join(', ')} already installed.`)
    )
    return
  }

  console.log(chalk.green(`installing ${packages.join(', ')}...`))

  for (const { version, installer } of notInstalled) {
    await runInstall(installer.dependencies)
    await installer.run({ version })
  }
}

await runInstall(program.args)
