import { useLocalStorage } from '@vueuse/core'
import type { LinkInspectionResult } from '../../types'

export const linkDb = useLocalStorage<Record<string, LinkInspectionResult[]>>('nuxt-link-checker-links', {})
