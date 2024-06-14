import { Glob, type GlobScanOptions } from 'bun'
import { statSync } from 'fs'
import path from 'path'

export class GlobBuilder {
  readonly #patterns = new Set<string>()
  #cache: Glob | undefined

  constructor(private readonly root = '') {}
  add(...patterns: string[]) {
    for (const pattern of patterns) {
      this.#patterns.add(pattern)
    }
    this.#cache = undefined
    return this
  }
  build() {
    if (!this.#cache) {
      this.#cache = new Glob(
        path.join(this.root, `{${[...this.#patterns].join(',')}}`)
      )
    }
    return this.#cache
  }
  runSync(options: string | GlobScanOptions = '.') {
    return [...this.build().scanSync(options)]
  }
  runSyncWithStat(options: string | GlobScanOptions = '.') {
    const cwd = typeof options === 'string' ? options : options.cwd
    return this.runSync(options).map((v) => {
      return { path: v, stat: statSync(path.join(cwd || '.', v)) }
    })
  }
}
