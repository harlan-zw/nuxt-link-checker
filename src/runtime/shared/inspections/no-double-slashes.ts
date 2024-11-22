import { defineRule } from './util'

export default function RuleNoDoubleSlashes() {
  return defineRule({
    id: 'no-double-slashes',
    test({ url, link, report }) {
      // malformed protocol relative link
      if (link.startsWith('//') && !link.includes('.')) {
        report({
          name: 'no-double-slashes',
          scope: 'warning',
          message: 'Links should not contain double slashes.',
          fix: link.replaceAll(/(^\/{2,}|\/{2,})/g, '/'),
          fixDescription: 'Remove double slashes.',
        })
      }
      // we want to match any paths that have double slashes (or triple etc)
      else if (url.pathname.match(/(^\/{2,}|\/{2,})/)) {
        report({
          name: 'no-double-slashes',
          scope: 'warning',
          message: 'Links should not contain double slashes.',
          fix: link.replace(url.pathname, url.pathname.replaceAll(/(^\/{2,}|\/{2,})/g, '/')),
          fixDescription: 'Remove double slashes.',
        })
      }
    },
  })
}
