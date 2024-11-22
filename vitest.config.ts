import { defineVitestConfig } from '@nuxt/test-utils/config'
/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import { isCI } from 'std-env'

export default defineVitestConfig({
  test: {
    poolOptions: {
      threads: {
        singleThread: !isCI,
      },
    },
    testTimeout: 60000,
  },
})
