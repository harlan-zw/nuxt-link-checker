import Fuse from 'fuse.js'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'

export default defineNitroPlugin(async (nitro) => {
  const pages = await $fetch('/api/__link_checker__/links') as string[]
  nitro._linkCheckerPageSearch = new Fuse(pages, {
    threshold: 0.5,
  })
})
