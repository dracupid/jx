import Bun from 'bun'
import { program } from 'commander'
import path from 'path'

// fix for jx install -h
process.execArgv = []
// process.env.FORCE_COLOR = '3'
const pkgJSON = await Bun.file(
  path.join(import.meta.dirname, '../package.json')
).json()

program
  .name(pkgJSON.name)
  .description(pkgJSON.description)
  .version(pkgJSON.version)

program
  .command('install <name>', 'install packages', { executableFile: 'install' })
  .alias('i')

// program
//   .command('split')
//   .description('Split a string into substrings and display as an array')
//   .argument('<string>', 'string to split')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined
//     console.log(str.split(options.separator, limit))
//   })
program.parse()
