import Fuse from 'fuse.js'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async (nitro) => {
  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker']
  const pages = runtimeConfig.hasLinksEndpoint ? await $fetch('/api/__link_checker__/links') as string[] : []
  nitro._linkCheckerPageSearch = new Fuse(pages, {
    threshold: 0.5,
  })
})
