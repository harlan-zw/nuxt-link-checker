import { useRuntimeConfig } from '#imports'
import { defineEventHandler } from '#nuxtseo/h3'

// verify a link
export default defineEventHandler(async (e) => {
  return {
    runtimeConfig: useRuntimeConfig(e).public['nuxt-link-checker'],
  }
})
