import { $ } from 'bun'
import { fileTypeFromStream } from 'file-type'
import { exists } from 'jxtk/fs'
import fs from 'node:fs'
import { matchFiles, replaceExtname } from '../lib/utils/file-tools'

export async function run(args: { files: string[] | undefined }) {
  const files = await matchFiles(args.files, ['*'])
  for (const f of files) {
    //@ts-expect-error node type
    const res = await fileTypeFromStream(fs.createReadStream(f))
    if (res) {
      const newFile = replaceExtname('.' + res.ext, f)
      if (newFile === f) continue
      if (await exists(newFile)) {
        throw new Error(`will overwrite file ${f} -> ${newFile}`)
      }
      console.log(`>> ${f} -> ${newFile}`)
      await $`mv -n ${f} ${newFile}`
    }
  }
}
