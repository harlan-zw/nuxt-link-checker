import type { useRoute } from '#imports'
import type { NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { NuxtApp } from 'nuxt/app'
import type { UnwrapRef } from 'vue'
import type { NuxtLinkCheckerClient } from '../../../types'
import { useRuntimeConfig } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { computed, createApp, h, ref, shallowReactive } from 'vue'
import { createFilter } from '../../../shared/sharedUtils'
import Main from './Main.vue'
import { linkDb } from './state'

function resolveDevtoolsIframe() {
  const iframe = document.querySelector('#nuxt-devtools-iframe') as Element & { contentWindow: { __NUXT_DEVTOOLS__: NuxtDevtoolsIframeClient } }
  if (!iframe)
    return
  return iframe?.contentWindow?.__NUXT_DEVTOOLS__
}

function resolvePathsForEl(el: Element): string[] {
  const parents = []
  let parent: HTMLElement | null = el.parentElement
  while (parent) {
    parents.push(parent)
    if (parents.length > 5)
      break
    parent = parent.parentElement
  }
  return [
    el.getAttribute('data-v-inspector')?.split(':')?.[0] || false,
    ...new Set(parents.map(p => p.getAttribute('data-v-inspector')?.split(':')?.[0] || false)),
  ].filter(Boolean) as string[]
}

export async function setupLinkCheckerClient({ nuxt, route }: { nuxt: NuxtApp, route: ReturnType<typeof useRoute> }) {
  const queue: { link: string, paths: string[], textContent: string, role: string }[] = []
  let queueWorkerTimer: any
  const inspectionEls = ref<UnwrapRef<NuxtLinkCheckerClient['inspectionEls']>>([])
  const highlightedLink = ref<string | null>(null)
  const visibleLinks = new Set<string>()
  const lastIds: string[] = []
  const elMap: Record<string, Element[]> = {}
  let devtoolsClient: NuxtDevtoolsIframeClient | undefined
  let isOpeningDevtools = false
  let startQueueIdleId: number
  let startQueueTimeoutId: number | false
  const showInspections = useLocalStorage('nuxt-link-checker:show-inspections', true)

  const runtimeConfig = useRuntimeConfig().public['nuxt-link-checker'] || {} as any
  const filter = createFilter({
    exclude: runtimeConfig.excludeLinks,
  })

  const client: NuxtLinkCheckerClient = shallowReactive({
    isWorkingQueue: false,
    isStarted: false,
    broadcast(event: string, payload?: any) {
      if (!import.meta.hot) {
        console.warn('No hot context')
        return
      }
      try {
        import.meta.hot.send(`nuxt-link-checker:${event}`, payload)
      }
      catch {}
    },
    openDevtoolsToLink(link: string) {
      if (isOpeningDevtools)
        return
      devtoolsClient = resolveDevtoolsIframe()
      isOpeningDevtools = true
      if (!devtoolsClient) {
        const devtoolsButton = document.querySelector('.nuxt-devtools-nuxt-button')
        // trigger a click
        if (devtoolsButton) {
          devtoolsButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))

          // wait for the iframe
          const interval = setInterval(() => {
            devtoolsClient = resolveDevtoolsIframe()
            if (devtoolsClient && devtoolsClient.host?.getIframe()) {
              devtoolsClient.host.getIframe()!.src = `/__nuxt_devtools__/client/modules/custom-nuxt-link-checker?link=${encodeURIComponent(link)}`
              isOpeningDevtools = false
              clearInterval(interval)
            }
          }, 250)
        }
      }
      else {
        devtoolsClient.host.devtools.open()

        const srcPath = new URL(devtoolsClient.host.getIframe()!.src).pathname
        // switch to the tab
        if (!srcPath.startsWith('/__nuxt_devtools__/client/modules/custom-nuxt-link-checker')) {
          devtoolsClient.host.getIframe()!.src = `/__nuxt_devtools__/client/modules/custom-nuxt-link-checker?link=${encodeURIComponent(link)}`
        }
        else {
          // set the filter via hook
          client.broadcast('filter', { link })
        }
        isOpeningDevtools = false
      }
    },
    reset(hard: boolean) {
      // clear db
      if (hard)
        linkDb.value = {}
      client.inspectionEls.value = []
      client.restart()
    },
    restart() {
      // we need to serialize the HTML and parse it using ESLint
      // serialize entire document
      const html = document.documentElement.outerHTML

      // we need to remove some elements to avoid recursion
      // #vue-tracer-overlay, #nuxt-devtools-container, #nuxt-link-checker-container
      // there all in the body root
      const cleanHtml = html
        // we need to match
        .replace(/<div id="nuxt-devtools-container"[^>]*>.*?<\/div>/s, '')
        .replace(/<div id="nuxt-link-checker-container"[^>]*>.*?<\/div>/s, '')
        .replace(/<div id="vue-tracer-overlay"[^>]*>.*?<\/div>/s, '')
        // we don't need these as we're only inspecting the HTML
        .replace(/<script.*?<\/script>/gs, '')
        .replace(/<style.*?<\/style>/gs, '')
      this.broadcast('audit', cleanHtml)
      // if (startQueueIdleId)
      //   cancelIdleCallback(startQueueIdleId)
      // // debounce to add to idle callback
      // startQueueIdleId = requestIdleCallback(() => {
      //   client.stopQueueWorker()
      //   // debounce for 500ms
      //   if (!startQueueTimeoutId) {
      //     startQueueTimeoutId = window.setTimeout(() => {
      //       client.scanLinks()
      //       client.startQueueWorker()
      //       startQueueTimeoutId = false
      //     }, 250)
      //   }
      // })
    },
    start() {
      if (client.isStarted)
        return
      client.isStarted = true
      // attach reactivity
      if (import.meta.hot) {
        import.meta.hot.on('nuxt-link-checker:reset', () => {
          client.reset(true)
        })
        import.meta.hot.on('nuxt-link-checker:scroll-to-link', (link) => {
          const inspection = inspectionEls.value.find(i => i.link === link)
          if (inspection) {
            inspection.el.scrollIntoView({
              behavior: 'smooth',
            })
            highlightedLink.value = inspection.link
            setTimeout(() => {
              highlightedLink.value = null
            }, 5000)
          }
        })
        import.meta.hot.on('nuxt-link-checker:live-inspections', ({ enabled }) => {
          showInspections.value = enabled
        })
        import.meta.hot.on('vite:afterUpdate', (ctx) => {
          if (ctx.updates.some(c => c.type === 'js-update'))
            client.reset(true)
        })
      }

      // watch the body for changes
      const observer = new MutationObserver(() => {
        client.reset(false)
      })
      observer.observe(document.querySelector('#__nuxt')!, {
        childList: true,
        subtree: true,
        // we only care if links are added, removed or updated
        attributeFilter: ['href'],
      })

      const holder = document.createElement('div')
      holder.id = 'nuxt-link-checker-container'
      holder.setAttribute('data-v-inspector-ignore', 'true')
      document.body.appendChild(holder)

      const app = createApp({
        render: () => h(Main, { client, inspections: client.inspectionEls, highlightedLink }),
      })
      app.mount(holder)

      client.restart()
    },
    visibleLinks,
    inspectionEls,
    linkDb: computed(() => linkDb.value[route.path] || []),
    showInspections,
  })

  if (nuxt.vueApp._instance)
    nuxt.vueApp._instance.appContext.provides.linkChecker = client

  // don't start until we open the tab
  if (import.meta.hot) {
    import.meta.hot.on('nuxt-link-checker:connected', () => {
      client.start()
    })
  }
}
