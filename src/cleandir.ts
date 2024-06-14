import { GlobBuilder } from '../lib/utils/GlobBuilder'
import { toSet } from './helpers'

const rules: Record<string, { less: string[]; more: string[] }> = {
  xlog: {
    more: ['*xlog*'],
    less: ['xlog*', '*xlog', 'xlog', '*xlog*.{zip,rar,txt,log}'],
  },
  apk: {
    more: ['*apk*'],
    less: [
      '*amm_app_preview*.apk',
      'app-guide-*.apk',
      'app-voip-*.apk',
      'weixin*android*.apk',
      'assist_*.apk',
      'wmpf-arm64-*.apk',
      'boot-arm64-*.apk',
    ],
  },
}

export function run(args: {
  preset: string | string[]
  aggressive: boolean
  remove: boolean
  dirs: string[]
}) {
  const glob = new GlobBuilder()
  const presets = toSet(args.preset)
  for (const p of presets) {
    const rule = rules[p]
    if (rule) {
      glob.add(...(args.aggressive ? rule.more : rule.less))
    }
  }

  for (const dir of args.dirs) {
    const result = glob.runSyncWithStat({ cwd: dir, onlyFiles: false })
    console.log('res:', result)
  }
}
