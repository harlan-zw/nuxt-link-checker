import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/eslint/index', name: 'eslint' },
  ],
  rollup: {
    emitCJS: false,
  },
  externals: [
    'eslint',
    'vue-eslint-parser',
  ],
  declaration: true,
})
