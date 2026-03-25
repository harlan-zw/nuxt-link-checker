import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: [
    { input: 'src/eslint/index', name: 'eslint' },
  ],
  externals: [
    'eslint',
    'vue-eslint-parser',
    'fuse.js',
    'radix3',
    'pathe',
  ],
})
