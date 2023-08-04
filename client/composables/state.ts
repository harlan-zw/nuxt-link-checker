import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import type { LinkInspectionResult } from '../../src/runtime/types'

export const linkDb = ref<LinkInspectionResult[]>([])
export const showLiveInspections = useStorage<boolean>('nuxt-link-checker:show-live-inspections', true)
export const visibleLinks = ref<string[]>([])
export const queueLength = ref(0)

export const linkFilter = ref<string | false>('')
