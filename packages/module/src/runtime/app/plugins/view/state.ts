import type { LinkInspectionResult } from '../../../types'
import { useLocalStorage } from '@vueuse/core'

export const linkDb = useLocalStorage<Record<string, LinkInspectionResult[]>>('nuxt-link-checker:links', {})
