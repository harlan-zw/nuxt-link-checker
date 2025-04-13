import nuxtAnalyze from '../../../eslint-plugin/src/config/nuxt'

export default [
  ...nuxtAnalyze({
    linkComponents: [
      'a',
      'NuxtLink',
      'RouterLink',
      'ULink',
    ],
    pages: [],
    trailingSlash: false,
  }),
]
