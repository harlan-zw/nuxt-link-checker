import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxt: any) => {
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

  import('./view/client')
    .then(({ setupLinkCheckerClient }) => {
      setupLinkCheckerClient({
        nuxt,
      })
    })
})
