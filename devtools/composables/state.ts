import type { LinkInspectionResult } from '../../src/runtime/types'

export const linkDb = ref<LinkInspectionResult[]>([])
export const showLiveInspections = useLocalStorage<boolean>('nuxt-link-checker:show-live-inspections', true)
export const visibleLinks = ref<string[]>([])
export const queueLength = ref(0)

export const linkFilter = ref<string | false>('')

export function useDebugData() {
  return useAsyncData<{ runtimeConfig: any } | null>('link-checker-debug', () => {
    if (!appFetch.value)
      return null
    return appFetch.value('/__link-checker__/debug.json')
  }, {
    watch: [appFetch, refreshTime],
    default: () => null,
  })
}
