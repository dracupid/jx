import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import pkgJSON from '../package.json' with { type: 'json' }

await yargs(hideBin(process.argv))
  .scriptName(pkgJSON.name)
  .command(
    'cleandir <dirs...>',
    'clean dir',
    (yargs) =>
      yargs
        .option('preset', {
          alias: 'p',
          desc: 'preset clean rule',
          choices: ['xlog', 'apk'],
          demandOption: true,
        })
        .option('remove', {
          alias: 'r',
          desc: 'remove files',
          boolean: true,
          default: false,
        })
        .option('aggressive', {
          alias: 'a',
          desc: 'user more aggressive pattern',
          boolean: true,
          default: false,
        })
        .positional('dirs', {
          describe: 'dir list',
          type: 'string',
          array: true,
          demandOption: true,
        }),
    async (args) => {
      const { run } = await import('./cleandir')
      run(args)
    }
  )
  .command(
    'install <packages...>',
    'install packages',
    (yargs) =>
      yargs.positional('packages', {
        describe: 'package list',
        type: 'string',
        array: true,
        demandOption: true,
      }),
    async (args) => {
      const { run } = await import('./install')
      return run(args)
    }
  )
  .demandCommand(1)
  .parseAsync()
