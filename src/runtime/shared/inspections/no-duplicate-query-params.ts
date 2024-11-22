import { defineRule } from './util'

export default function RuleNoDuplicateQueryParams() {
  return defineRule({
    id: 'no-duplicate-query-params',
    test({ report, link, url }) {
      if (!url.search)
        return
      // we should process it manually because URLSearchParams doesn't handle this case
      const search = url.search.slice(1)
      // need to create an array of all key values
      const searchParams = search.split('&').map(param => param.split('=')[0])
      // check if there are any duplicated keys
      const duplicates = new Set()
      for (const param of searchParams) {
        if (duplicates.has(param)) {
          // the fix should be to remove the duplicate
          const fix = link.replace(new RegExp(`([?&])${param}=[^&]*&?`), '$1')
          report({
            name: 'no-duplicate-query-params',
            scope: 'warning',
            message: 'Links should not contain duplicated query parameters.',
            fix,
            tip: 'Duplicate query parameters can cause canonical URL issues.',
            fixDescription: 'Remove duplicate query parameter.',
          })
          return
        }
        duplicates.add(param)
      }
    },
  })
}
