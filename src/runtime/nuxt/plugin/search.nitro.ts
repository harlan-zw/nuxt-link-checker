import Fuse from 'fuse.js'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'

export default defineNitroPlugin((nitro) => {
  setTimeout(() => {
    $fetch('/__link-checker__/links').then((pages: string[]) => {
      // @ts-expect-error context hack
      nitro._linkCheckerPageSearch = new Fuse(pages, {
        threshold: 0.5,
      })
    })
  }, 200)
})
