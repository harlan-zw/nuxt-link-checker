import type { ComputedRef, Ref } from 'vue'
import type { LinkInspectionResult } from '../types'

export interface NuxtLinkCheckerClient {
  isStarted: boolean
  reset: (hard: boolean) => void
  start: () => void
  restart: () => void
  scanLinks: () => void
  startQueueWorker: () => void
  stopQueueWorker: () => void
  broadcast: (event: string, payload?: any) => void
  openDevtoolsToLink: (link: string) => void
  maybeAttachEls: (payload?: LinkInspectionResult) => void
  inspectionEls: Ref<(LinkInspectionResult & { el: Element })[]>
  visibleLinks: Set<string>
  isWorkingQueue: boolean
  linkDb: ComputedRef<LinkInspectionResult[]>
  showInspections: Ref<boolean>
}
