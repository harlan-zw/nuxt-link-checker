import { defineRule } from './util'

export default function RuleDescriptiveLinkText() {
  return defineRule({
    id: 'link-text',
    test({ textContent, report }) {
      if (typeof textContent === 'undefined')
        return
      if (!textContent) {
        report({
          name: 'link-text',
          scope: 'warning',
          message: 'Missing link textContent, title or aria-label.',
          tip: 'Links with descriptive text are easier to understand for screen readers and search engines.',
        })
      }
      const uniformLinkText = textContent.trim().toLowerCase()
      const listOfBadDescriptiveLinkTexts = [
        'click here',
        'click this',
        'go',
        'here',
        'this',
        'start',
        'right here',
        'more',
        'learn more',
      ]
      if (listOfBadDescriptiveLinkTexts.includes(uniformLinkText)) {
        report({
          name: 'link-text',
          scope: 'warning',
          message: `Link text "${textContent}" should be more descriptive.`,
          tip: `The ${textContent} descriptive text does not provide any context to the link.`,
        })
      }
    },
  })
}
