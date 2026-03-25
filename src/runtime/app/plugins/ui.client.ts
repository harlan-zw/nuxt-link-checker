import type { ObjectPlugin } from 'nuxt/app'
import { defineNuxtPlugin, useRoute } from '#imports'

const plugin: ObjectPlugin = defineNuxtPlugin((nuxt: any) => {
  if (typeof document === 'undefined' || typeof window === 'undefined')
    return

  try {
    if (window.__NUXT_DEVTOOLS_DISABLE__ || window.parent?.__NUXT_DEVTOOLS_DISABLE__)
      return

    if (parent && window.self !== parent) {
      if (parent.__NUXT_DEVTOOLS_VIEW__ || parent.document.querySelector('#nuxt-devtools-container'))
        return
    }
  }
  catch (e) {
    console.error('Nuxt DevTools: Failed to check parent window')
    console.error(e)
  }

  const route = useRoute()
  import('./view/client')
    .then(({ setupLinkCheckerClient }) => {
      setupLinkCheckerClient({
        route,
        nuxt,
      })
    })
})
export default plugin
