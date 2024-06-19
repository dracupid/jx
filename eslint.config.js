//@ts-check
import { useTs, useESLintConfig } from '@jaxonzhao/boot/eslint'

export default useESLintConfig(...useTs(import.meta.dirname), {
  rules: {
      'n/no-unsupported-features/node-builtins': 0,
    },
})
