import { defineEventHandler } from '#nuxtseo/h3'
import { useRuntimeConfig } from '#nuxtseo/nitro'

// verify a link
export default defineEventHandler(async (e) => {
  return {
    runtimeConfig: useRuntimeConfig(e).public['nuxt-link-checker'],
  }
})
