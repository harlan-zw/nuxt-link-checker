import type Fuse from 'fuse.js'
import type { SiteConfigResolved } from 'site-config-stack'
import type { ParsedURL } from 'ufo'
import type { ComputedRef, Ref } from 'vue'

export interface Rule {
  id: string
  test: (ctx: RuleTestContext) => void
  externalLinks?: boolean
}

export interface RuleTestContext {
  link: string
  url: ParsedURL
  role: string
  textContent: string
  ids: string[]
  fromPath: string
  response: any
  siteConfig: SiteConfigResolved
  pageSearch?: Fuse<{ link: string, title?: string }>
  report: (report: RuleReport, stop?: boolean) => void
  skipInspections?: string[]
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
  textContent: string
  error: RuleReport[]
  warning: RuleReport[]
  passes: boolean
  sources?: InspectionSource[]
  diff?: { diff: InspectionDiff, code: string, filepath: string }[]
}

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
