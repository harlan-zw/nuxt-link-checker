import type { RouteRecordRaw } from 'vue-router'

export interface NuxtAuditESLintConfigOptions {
  pages: RouteRecordRaw[]
  trailingSlash?: boolean
  siteUrl?: string
  titles: Record<string, number>
  descriptions: Record<string, number>
  vueLinkComponents: Record<string, string[]>
  brokenImageMap?: Record<string, number>
}
