import { createLogger } from 'jtk/log'
import { formatPackages } from '../lib/install/packages'

const logger = createLogger('jx:install')

async function runInstall(packages?: string[]) {
  if (!packages || packages.length === 0) return

  const { installed, unknown, notInstalled } = await formatPackages(packages)

  if (unknown.size > 0) {
    logger.error(`unknown package(s): ${[...unknown].join(', ')}`)
    process.exit(1)
  }

  if (installed.size > 0) {
    logger.log(`[jx] ${[...installed].join(', ')} already installed.`)
    return
  }

  logger.log(`installing ${packages.join(', ')}...`)

  for (const { version, installer } of notInstalled) {
    await runInstall(installer.dependencies)
    await installer.run({ version })
  }
}

export async function run(args: { packages: string[] }) {
  await runInstall(args.packages)
}
