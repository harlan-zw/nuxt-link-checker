import type { FetchResponse } from 'ofetch'
import type { H3Event } from 'h3'
import type { SiteConfig } from 'nuxt-site-config-kit'
import type Fuse from 'fuse.js'
import type { ComputedRef, Ref } from 'vue'

export interface Rule {
  test(ctx: RuleTestContext): void
}

export interface RuleTestContext {
  link: string
  ids: string[]
  fromPath: string
  response: FetchResponse<any>
  e: H3Event
  siteConfig: SiteConfig
  pageSearch: Fuse<string>
  report: (report: RuleReport) => void
}

export interface RuleReport {
  name: string
  scope: 'error' | 'warning'
  message: string
  fix?: string
  fixDescription?: string
  tip?: string
  canRetry?: boolean
}

export interface InspectionPreview {
  code: string
  lineNumber: number
  columnNumber: number
}

export interface InspectionSource {
  filepath: string
  previews: InspectionPreview[]
  lang: string
}

export interface InspectionDiff {
  added: number[]
  removed: number[]
  result: string
}

export interface LinkInspectionResult {
  link: string
  fix: string
  error: RuleReport[]
  warning: RuleReport[]
  passes: boolean
  sources?: InspectionSource[]
  diff?: { diff: InspectionDiff; code: string }[]
}

export interface NuxtLinkCheckerClient {
  reset(hard: boolean): void
  start(): void
  restart(): void
  scanLinks(): void
  startQueueWorker(): void
  stopQueueWorker(): void
  broadcast(event: string, payload?: any): void
  openDevtoolsToLink(link: string): void
  maybeAttachEls(payload?: LinkInspectionResult): void
  inspectionEls: Ref<(LinkInspectionResult & { el: Element })[]>
  visibleLinks: Set<string>
  isWorkingQueue: boolean
  linkDb: ComputedRef<LinkInspectionResult[]>
}
