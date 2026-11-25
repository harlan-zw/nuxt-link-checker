import type { ESLint } from 'eslint'
import { markdownProcessor } from './processor.ts'
import validRoute from './rules/valid-route.ts'
import validSitemapLink from './rules/valid-sitemap-link.ts'

const plugin: ESLint.Plugin = {
  meta: {
    name: 'nuxt-link-checker',
    version: '1.0.0',
  },
  rules: {
    'valid-route': validRoute,
    'valid-sitemap-link': validSitemapLink,
  },
  processors: {
    markdown: markdownProcessor,
  },
}

export default plugin
