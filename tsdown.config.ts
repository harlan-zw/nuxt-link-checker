import { builder } from '@nuxt/module-builder/tsdown'
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [
    builder({
      entries: [{ input: 'src/eslint/index', name: 'eslint' }],
      externals: [
        'eslint',
        'vue-eslint-parser',
        'fuse.js',
        'radix3',
        'pathe',
        'unstorage/drivers/fs',
        'nuxt/server',
      ],
    }),
  ],
})
