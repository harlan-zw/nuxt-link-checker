import { defineRule } from './util'

export default function RuleNoJavascript() {
  return defineRule({
    test({ link, report }) {
      if (link.startsWith('javascript:')) {
        report({
          name: 'no-javascript',
          scope: 'error',
          tip: 'Using a <button type="button"> instead as a better practice.',
          message: 'Should not use JavaScript',
        })
      }
    },
  })
}
