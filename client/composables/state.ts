import { ref } from 'vue'
import type { LinkInspectionResult } from '../../src/runtime/types'

export const linkDb = ref<LinkInspectionResult[]>([])
export const visibleLinks = ref<string[]>([])
export const queueLength = ref(0)

export const linkFilter = ref<string | false>('')
