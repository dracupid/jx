import { createLogger } from 'jtk/log'
import { formatPackages, loaders } from '../lib/install/packages'

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

export async function run(args: {
  packages: string[] | undefined
  list: boolean
}) {
  const packages = args.packages || []
  if (args.list || packages.length === 0) {
    if (!args.list && packages.length === 0) {
      logger.warn('no package specified, you can install following packages:')
    }
    Object.entries(loaders).forEach(([name, data]) => {
      if (data.alias) {
        console.log(`> ${name} (${data.alias.join(',')})`)
      } else {
        console.log(`> ${name}`)
      }
    })
  } else if (packages.length > 0) {
    await runInstall(args.packages)
  }
}
