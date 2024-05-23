import Fuse from 'fuse.js'
import { fixSlashes } from 'site-config-stack/urls'
import type { RuleReport } from '../../types'
import { defineRule } from './util'

export default function RuleMissingHash() {
  return defineRule({
    test({ link, report, ids, fromPath }) {
      const [path, hash] = link.split('#')
      if (!link.includes('#') || link.endsWith('#top') || fixSlashes(false, path) !== fromPath)
        return

      if (ids.includes(hash))
        return

      const fuse = new Fuse(ids, {
        threshold: 0.6,
      })
      const fixedHash = fuse.search(hash.replace('#', ''))?.[0]?.item

      const payload: RuleReport = {
        name: 'missing-hash',
        scope: 'error',
        message: `No element with id "${hash}" found.`,
      }
      if (fixedHash) {
        payload.fix = `${link.split('#')[0]}#${fixedHash}`
        payload.fixDescription = `Did you mean ${payload.fix}?`
      }

      report(payload)
    },
  })
}
