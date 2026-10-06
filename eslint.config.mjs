import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  {
    type: 'lib',
    vue: true,
    ignores: [
      '.migration-sources/**',
      '.migration-checkouts/**',
      '.migration-artifacts/**',
      '.migration-*.json',
      'migration-sources.json',
      'migration-artifacts.json',
      '.benchmark/**',
      'scripts/migration-lock.yaml',
    ],
  },
  ...harlanzw({ base: true, link: true, nuxt: true, vue: true }),
)
