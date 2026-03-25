import type { LinkInspectionResult } from '../../src/runtime/types'

export const linkDb = ref<LinkInspectionResult[]>([])
export const showLiveInspections = useLocalStorage<boolean>('nuxt-link-checker:show-live-inspections', true)
export const visibleLinks = ref<string[]>([])
export const queueLength = ref(0)

export const linkFilter = ref<string | false>('')

export const data = ref<{
  runtimeConfig: any
} | null>(null)

export async function fetchDebugData(): Promise<void> {
  if (appFetch.value)
    data.value = await appFetch.value('/__link-checker__/debug.json')
}
