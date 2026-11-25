import type Fuse from 'fuse.js'
import type { SiteConfigResolved } from 'site-config-stack'
import type { ParsedURL } from 'ufo'

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
  /**
   * Whether a link path resolves to a public directory index, such as `/demo/` for `public/demo/index.html`.
   */
  isPublicDirectoryIndex?: (path: string) => boolean
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
