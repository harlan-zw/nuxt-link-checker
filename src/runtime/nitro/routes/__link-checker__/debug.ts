import { defineEventHandler } from 'h3'
import { useNitroApp, useRuntimeConfig } from '#imports'

// verify a link
export default defineEventHandler(async (e) => {
  return {
    runtimeConfig: useRuntimeConfig(e).public['nuxt-link-checker'],
  }
})
