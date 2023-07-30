import type { UnwrapRef } from 'vue'
import { computed, createApp, h, ref, shallowReactive, unref } from 'vue'
import type { NuxtApp } from 'nuxt/app'
import type { NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { LinkInspectionResult, NuxtLinkCheckerClient } from '../../types'
import Main from './Main.vue'
import { linkDb } from './state'
import { useRoute } from '#imports'

function resolveDevtoolsIframe() {
  return document.querySelector('#nuxt-devtools-iframe')?.contentWindow?.__NUXT_DEVTOOLS__
}

function resolvePathsForEl(el: Element) {
  const parents = []
  let parent: HTMLElement | null = el.parentElement
  while (parent) {
    parents.push(parent)
    if (parents.length > 5)
      break
    parent = parent.parentElement
  }
  return [...new Set(parents.map(p => p.getAttribute('data-v-inspector')?.split(':')?.[0] || false).filter(Boolean))]
}

export async function setupLinkCheckerClient({ nuxt }: { nuxt: NuxtApp }) {
  let queue: { link: string; inspect: () => Promise<LinkInspectionResult> }[] = []
  let queueWorkerTimer: any
  const inspectionEls = ref<UnwrapRef<NuxtLinkCheckerClient['inspectionEls']>>([])
  const visibleLinks = new Set<string>()
  let elMap: Record<string, Element[]> = {}
  let devtoolsClient: NuxtDevtoolsIframeClient | undefined
  let isOpeningDevtools = false
  const route = useRoute()

  const client: NuxtLinkCheckerClient = shallowReactive({
    isWorkingQueue: false,
    scanLinks() {
      elMap = {}
      visibleLinks.clear()
      const ids = [...new Set([...document.querySelectorAll('#__nuxt [id]')].map(el => el.id))]
      ;[...document.querySelectorAll('#__nuxt a')]
        .map(el => ({ el, link: el.getAttribute('href')! }))
        .forEach(({ el, link }) => {
          if (!link)
            return
          visibleLinks.add(link)
          elMap[link] = elMap[link] || []
          if (elMap[link].includes(el))
            return
          elMap[link].push(el)
          const paths = resolvePathsForEl(el)

          const payload = linkDb.value[route.path]?.find(d => d.link === link)
          // if we have a payload or its already queued, skip
          if (payload || queue.find(q => q.link === link)) {
            client.maybeAttachEls(payload)
            return
          }
          queue.push({
            link: link!,
            async inspect() {
              return await $fetch<LinkInspectionResult>('/api/__link_checker__/inspect', {
                method: 'post',
                query: { link: encodeURIComponent(link!) },
                body: { paths, ids },
              })
            },
          })
        })
      client.broadcast('updated')
    },
    startQueueWorker() {
      client.stopQueueWorker()
      async function workQueue() {
        if (queue.length <= 0) {
          client.stopQueueWorker()
          return
        }
        const task = queue.pop()
        if (!task) {
          client.stopQueueWorker()
          return
        }
        client.isWorkingQueue = true
        let payload = linkDb.value[route.path]?.find(d => d.link === task.link)
        if (!payload) {
          payload = await task.inspect()
          if (payload) {
            linkDb.value[route.path] = linkDb.value[route.path] || []
            linkDb.value[route.path].push(payload)
          }
        }
        // attach inspections to elements
        client.maybeAttachEls(payload)
        client.broadcast('queueWorking', { queueLength: queue.length })
        queueWorkerTimer = setTimeout(workQueue, 500)
      }
      workQueue()
    },
    maybeAttachEls(payload?: LinkInspectionResult) {
      // must not pass
      if (!payload || payload.passes)
        return
      const els = elMap?.[payload.link] || []
      for (const el of els)
        client.inspectionEls.value.push({ ...unref(payload), el })
    },
    stopQueueWorker() {
      if (client.isWorkingQueue) {
        queue = []
        client.isWorkingQueue = false
        queueWorkerTimer && clearInterval(queueWorkerTimer)
      }
    },
    broadcast(event: string, payload?: any) {
      if (!import.meta.hot) {
        console.warn('No hot context')
        return
      }
      import.meta.hot.send(`nuxt-link-checker:${event}`, payload)
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
            if (devtoolsClient) {
              devtoolsClient.host.getIframe()!.src = `/__nuxt_devtools__/client/modules/custom-nuxt-link-checker?link=${encodeURIComponent(link)}`
              isOpeningDevtools = false
              clearInterval(interval)
            }
          }, 250)
        }
      }
      else {
        devtoolsClient.host.open()

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
      requestIdleCallback(() => {
        client.stopQueueWorker()
        client.scanLinks()
        client.startQueueWorker()
      })
    },
    start() {
      // attach reactivity
      if (import.meta.hot) {
        import.meta.hot.on('nuxt-link-checker:reset', () => client.reset(true))
        import.meta.hot.on('vite:afterUpdate', () => client.reset(true))
      }

      // watch the body for changes
      const observer = new MutationObserver(() => client.reset(false))
      observer.observe(document.querySelector('#__nuxt')!, { childList: true, subtree: true })

      if (nuxt.vueApp._instance)
        nuxt.vueApp._instance.appContext.provides.linkChecker = client
      const holder = document.createElement('div')
      holder.id = 'nuxt-link-checker-container'
      holder.setAttribute('data-v-inspector-ignore', 'true')
      document.body.appendChild(holder)

      const app = createApp({
        render: () => h(Main, { client, inspections: client.inspectionEls }),
      })
      app.mount(holder)

      client.restart()
    },
    visibleLinks,
    inspectionEls,
    linkDb: computed(() => linkDb.value[route.path] || []),
  })

  client.start()
}
