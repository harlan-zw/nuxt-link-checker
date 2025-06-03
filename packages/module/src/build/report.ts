import type Fuse from 'fuse.js'
import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { SiteConfigResolved } from 'site-config-stack'
import type { Storage } from 'unstorage'
import type { ModuleOptions } from '../module'
import type { LinkInspectionResult } from '../runtime/types'
import { colors } from 'consola/utils'
import { relative, resolve } from 'pathe'

export interface PathReport {
  route: string
  reports: Partial<LinkInspectionResult>[]
}

export interface ExtractedPayload {
  title?: string
  description?: string
  ogImage?: string
  links: { link: string, textContent: string }[]
  ids: string[]
  images: { src: string }[]
  textHtmlRatio: number
}

export interface InspectionContext {
  urlFilter: (url: string) => boolean
  config: ModuleOptions
  nuxt: Nuxt
  pageSearcher: Fuse<{ link: string, title?: string }>
  siteConfig: SiteConfigResolved
  nitro: Nitro
  storage: Storage
  storageFilepath: string
  totalRoutes: number
  version?: string
  isPrerenderingAllRoutes: boolean
}

export async function generateReports(reports: PathReport[], ctx: InspectionContext) {
  const report = ctx.config.report || {}
  const reportPaths: string[] = []
  if (report.html) {
    // TODO
  }

  if (report.markdown) {
    reportPaths.push(await generateMarkdownReport(reports, ctx))
  }

  if (report.json) {
    reportPaths.push(await generateJsonReport(reports, ctx))
  }
  if (reportPaths.length) {
    const nitro = ctx.nitro
    ctx.nitro.logger.info(
      `${colors.dim('Nuxt Link Checker')} Reports written to:`,
    )
    reportPaths.forEach((path) => {
      nitro.logger.log(`  • \`${relative(process.cwd(), path)}\``)
    })
  }
}

async function generateMarkdownReport(reports: PathReport[], { storage, storageFilepath }: InspectionContext) {
  // Create document header with timestamp and summary
  const timestamp = new Date().toLocaleString()
  const totalErrors = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.error?.length).length, 0)
  const totalWarnings = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.warning?.length).length, 0)

  const header = [
    '# Nuxt Link Checker Report',
    '',
    `**Generated:** ${timestamp}`,
    '',
    '## Summary',
    '',
    `- **Pages checked:** ${reports.length}`,
    `- **Total errors:** ${totalErrors}`,
    `- **Total warnings:** ${totalWarnings}`,
    '',
    '---',
    '',
  ].join('\n')

  // Table of contents for quick navigation
  const toc = reports.map(({ route }) => `- [${route}](#${createAnchor(route)})`).join('\n')
  const reportMarkdown = reports
    .map(({ route, reports }) => {
      const errors = reports.filter(r => r.error?.length).length
      const warnings = reports.filter(r => r.warning?.length).length
      const statusEmoji = errors > 0 ? '❌' : warnings > 0 ? '⚠️' : '✅'
      const statusString = [
        errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : '',
        warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : '',
      ].filter(Boolean).join(', ')

      // Group issues by link for better organization
      const linkIssues = new Map()

      reports.forEach((r) => {
        if ((r.error?.length || 0) + (r.warning?.length || 0) === 0)
          return

        if (!linkIssues.has(r.link)) {
          linkIssues.set(r.link, {
            errors: [],
            warnings: [],
            textContent: r.textContent || '',
          })
        }

        const issues = linkIssues.get(r.link)
        if (r.error?.length)
          issues.errors.push(...r.error)
        if (r.warning?.length)
          issues.warnings.push(...r.warning)
      })

      // Format each link's issues
      const linksMarkdown = Array.from(linkIssues.entries())
        .map(([link, issues]) => {
          const linkMd = [
            `### Link: [${truncateString(link, 60)}](${link})`,
            issues.textContent ? `> Link text: "${issues.textContent}"` : '',
            '',
          ]

          if (issues.errors.length) {
            linkMd.push('#### Errors')
            issues.errors.forEach((err) => {
              linkMd.push(`- **${err.name}:** ${err.message}`)
              if (err.fix)
                linkMd.push(`  - *Suggestion:* ${err.fixDescription}`)
            })
            linkMd.push('')
          }

          if (issues.warnings.length) {
            linkMd.push('#### Warnings')
            issues.warnings.forEach((warn) => {
              linkMd.push(`- **${warn.name}:** ${warn.message}`)
              if (warn.fix)
                linkMd.push(`  - *Suggestion:* ${warn.fixDescription}`)
            })
            linkMd.push('')
          }

          return linkMd.filter(line => line !== '').join('\n')
        })
        .join('\n')

      return [
        `## ${statusEmoji} [${route}](${route}) ${statusString ? `(${statusString})` : ''}`,
        '',
        linkIssues.size > 0
          ? linksMarkdown
          : '*No issues found on this page*',
        '',
        '<div align="right"><a href="#nuxt-link-checker-report">↑ Back to top</a></div>',
        '',
        '---',
        '',
      ].join('\n')
    })
    .join('\n')

  const markdown = [
    header,
    '## Table of Contents',
    '',
    toc,
    '',
    '---',
    '',
    reportMarkdown,
  ].join('\n')

  await storage.setItem('link-checker-report.md', markdown)
  return resolve(storageFilepath, 'link-checker-report.md')
}

// Helper function to create GitHub-compatible anchor links
function createAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Helper function to truncate long strings
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength)
    return str
  return `${str.substring(0, maxLength - 3)}...`
}

async function generateJsonReport(reports: PathReport[], { storage, storageFilepath }: InspectionContext) {
  const json = JSON.stringify(reports, null, 2)
  await storage.setItem('link-checker-report.json', json)
  return resolve(storageFilepath, 'link-checker-report.json')
}
