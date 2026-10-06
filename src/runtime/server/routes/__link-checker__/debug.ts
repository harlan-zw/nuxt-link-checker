import { defineEventHandler, useRuntimeConfig } from 'nuxt/server'

// verify a link
export default defineEventHandler(async () => {
  return {
    runtimeConfig: useRuntimeConfig().public['nuxt-link-checker'],
  }
})
