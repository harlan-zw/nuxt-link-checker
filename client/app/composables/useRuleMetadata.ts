import { rules as HtmlEslintRules } from '@html-eslint/eslint-plugin'
import rules from 'nuxt-analyze-eslint-plugin/rules'

export function useRuleMetadata() {
  return { ...rules, ...HtmlEslintRules }
}
