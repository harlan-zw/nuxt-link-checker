import type { LinkInspectionResult } from './types'
import { useAsyncData } from '#imports'
import { useLocalStorage } from '@vueuse/core'
import { appFetch } from 'nuxtseo-layer-devtools/composables/rpc'
import { refreshTime } from 'nuxtseo-layer-devtools/composables/state'
import { computed, ref } from 'vue'

export const linkDb = ref<LinkInspectionResult[]>([])
export const showLiveInspections = useLocalStorage<boolean>('nuxt-link-checker:show-live-inspections', true)
export const visibleLinks = ref<string[]>([])
export const queueLength = ref(0)

export const linkFilter = ref<string | false>('')

// Derived link views shared across the Inspections and Links tabs
export const nodes = computed(() => {
  const validLinks = visibleLinks.value
  let n = [...linkDb.value]
  if (linkFilter.value)
    n = n.filter(node => node.link === linkFilter.value)
  else
    n = n.filter(node => validLinks.includes(node.link))
  return n.sort((a, b) => (a.fix && !b.fix ? 1 : -1))
})

export const failingNodes = computed(() => {
  const seen = new Set<string>()
  return nodes.value.filter((n) => {
    if (!n.error.length && !n.warning.length)
      return false
    if (seen.has(n.link))
      return false
    seen.add(n.link)
    return true
  })
})

export const internalLinks = computed(() => nodes.value.filter(n => n.passes && n.link.startsWith('/')))
export const externalLinks = computed(() => nodes.value.filter(n => n.passes && !n.link.startsWith('/')))
export const errorCount = computed(() => nodes.value.reduce((count, n) => count + n.error.length, 0))
export const warningCount = computed(() => nodes.value.reduce((count, n) => count + n.warning.length, 0))
export const visibleLinkCount = computed(() => visibleLinks.value.length)

export function useDebugData(): any {
  return useAsyncData<{ runtimeConfig: any } | null>('link-checker-debug', () => {
    if (!appFetch.value)
      return null
    return appFetch.value('/__link-checker__/debug.json')
  }, {
    watch: [appFetch, refreshTime],
    default: () => null,
  })
}
