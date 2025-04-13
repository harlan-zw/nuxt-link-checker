import type { RouteRecordRaw } from 'vue-router'

export interface NuxtAuditESLintConfigOptions {
  linkComponents: string[]
  pages: RouteRecordRaw[]
  trailingSlash?: boolean
  siteUrl?: string
}
