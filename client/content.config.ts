import { resolve } from 'node:path'
import { defineCollection, defineContentConfig } from '@nuxt/content'

export const content = defineContentConfig({
  collections: {
    rules: defineCollection({
      type: 'page',
      source: {
        include: '**/*.md',
        cwd: resolve(__dirname, '../packages/eslint-plugin/src/rules'),
      },
    }),
  },
})

export default content
