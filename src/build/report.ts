import type Fuse from 'fuse.js'
import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { SiteConfigResolved } from 'site-config-stack'
import type { Storage } from 'unstorage'
import type { ModuleOptions } from '../module'
import type { LinkInspectionResult } from '../runtime/types'
import { colors } from 'consola/utils'
import { useSiteConfig } from 'nuxt-site-config/kit'
import { relative, resolve } from 'pathe'
import { htmlTemplate } from './template'

export interface PathReport {
  route: string
  reports: Partial<LinkInspectionResult>[]
}

export interface ExtractedPayload {
  title?: string
  links: { link: string, textContent: string }[]
  ids: string[]
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
    reportPaths.push(await generateHtmlReport(reports, ctx))
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

async function generateHtmlReport(reports: PathReport[], {
  storage,
  storageFilepath,
  totalRoutes,
  version,
}: InspectionContext) {
  const timestamp = new Date().toLocaleString()
  const totalErrors = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.error?.length).length, 0)
  const totalWarnings = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.warning?.length).length, 0)

  // Collect issue frequencies
  const issueFrequency: Record<string, { count: number, type: 'error' | 'warning' }> = {}

  reports.forEach(({ reports: routeReports }) => {
    routeReports.forEach((report) => {
      // Process errors
      report.error?.forEach((err) => {
        const key = `${err.name}: ${err.message}`
        if (!issueFrequency[key]) {
          issueFrequency[key] = { count: 0, type: 'error' }
        }
        issueFrequency[key].count++
      })

      // Process warnings
      report.warning?.forEach((warning) => {
        const key = `${warning.name}: ${warning.message}`
        if (!issueFrequency[key]) {
          issueFrequency[key] = { count: 0, type: 'warning' }
        }
        issueFrequency[key].count++
      })
    })
  })

  const issuesList = Object.entries(issueFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([issue, { count, type }]) => {
      const iconClass = type === 'error' ? 'error-icon' : 'warning-icon'
      const icon = type === 'error' ? '✖' : '⚠'
      return `
      <li class="common-issue ${type}">
        <span class="${iconClass}" aria-hidden="true">${icon}</span>
        <span class="issue-count">${count}</span>
        <span class="issue-text">${issue}</span>
      </li>
    `
    })
    .join('')

  const issueSummary = issuesList
    ? `
  <div class="issues-summary">
    <ul class="common-issues-list">
      ${issuesList}
    </ul>
  </div>
`
    : ''

  // Get package version - you can add this to your module context
  const reportMeta = `
    <div class="report-meta">
      <div class="version">Nuxt Link Checker v${version}</div>
      <div class="timestamp">Generated: ${timestamp}</div>
    </div>
  `

  // Create summary section
  const summary = `
   <div class="summary">
      <h2>Summary</h2>
      <ul class="summary-stats">
        <li>
          <span class="stat-icon">📄</span>
          <span class="stat-label">Failing Pages</span>
          <span class="stat-value">${reports.length} / ${totalRoutes}</span>
        </li>
        <li>
          <span class="stat-icon">❌</span>
          <span class="stat-label">Total errors</span>
          <span class="stat-value error-count">${totalErrors}</span>
        </li>
        <li>
          <span class="stat-icon">⚠️</span>
          <span class="stat-label">Total warnings</span>
          <span class="stat-value warning-count">${totalWarnings}</span>
        </li>
      </ul>
    </div>
  `
  // Create a table of contents
  const tocHtml = reports
    .map(({ route, reports }) => {
      const errors = reports.filter(r => r.error?.length).length
      const warnings = reports.filter(r => r.warning?.length).length

      const statusClass = errors > 0 ? 'toc-error' : warnings > 0 ? 'toc-warning' : 'toc-valid'
      const statusEmoji = errors > 0 ? '❌' : warnings > 0 ? '⚠️' : '✅'
      const statusString = [
        errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : '',
        warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : '',
      ].filter(Boolean).join(', ')

      return `<li class="${statusClass}">
        <a style="display: block;" href="#route-${createAnchor(route)}">${statusEmoji} ${route}
        ${statusString ? `<span class="toc-status">(${statusString})</span>` : ''}
        </a>
      </li>`
    })
    .join('')

  const reportHtml = reports
    .map(({ route, reports }) => {
      const errors = reports.filter(r => r.error?.length).length
      const warnings = reports.filter(r => r.warning?.length).length

      const statusClass = errors > 0 ? 'status-error' : warnings > 0 ? 'status-warning' : 'status-valid'
      const statusString = [
        errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : false,
        warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : false,
      ].filter(Boolean).join(', ')

      const reportsHtml = reports
        .filter(r => r.error?.length || r.warning?.length)
        .map((r) => {
          const hasErrors = r.error?.length > 0
          const hasWarnings = r.warning?.length > 0
          const linkClass = hasErrors ? 'link-error' : hasWarnings ? 'link-warning' : 'link-valid'

          const errors = r.error?.map(error =>
            `<li class="error">
              <span class="error-icon" aria-hidden="true">✖</span>
              <span class="error-message">${error.message}</span>
              <span class="error-type">${error.name}</span>
              ${error.fix ? `<div class="fix-suggestion"><span class="fix-label">Suggestion:</span> ${error.fixDescription}</div>` : ''}
            </li>`,
          ) || []

          const warnings = r.warning?.map(warning =>
            `<li class="warning">
              <span class="warning-icon" aria-hidden="true">⚠</span>
              <span class="warning-message">${warning.message}</span>
              <span class="warning-type">${warning.name}</span>
              ${warning.fix ? `<div class="fix-suggestion"><span class="fix-label">Suggestion:</span> ${warning.fixDescription}</div>` : ''}
            </li>`,
          ) || []

          return `
          <div class="link-item ${linkClass}">
            <div class="link-header">
              <a href="${r.link}" class="link-url">${r.link}</a>
              <div class="link-text">${r.textContent ? `"${r.textContent}"` : ''}</div>
            </div>
            ${(errors.length + warnings.length) > 0
              ? `<ul class="issues-list">${[...errors, ...warnings].join('')}</ul>`
              : '<div class="valid-message">Valid</div>'}
          </div>`
        })
        .join('')

      return `
      <section id="route-${createAnchor(route)}" class="route-section ${statusClass}">
        <h2 class="route-header">
          <a href="${route}" class="route-link">${route}</a>
          <span class="route-status">${statusString}</span>
        </h2>
        <div class="route-issues">
          ${reportsHtml || '<div class="no-issues">No issues found</div>'}
        </div>
        <div class="back-to-top"><a href="#toc">↑ Back to Table of Contents</a></div>
      </section>`
    })
    .join('')
  // Add table of contents and styles for it
  const tableOfContents = `
      <h2>Table of Contents</h2>
    <div id="toc" class="table-of-contents">
      <ul class="toc-list">
        ${tocHtml || '<li>No issues found</li>'}
      </ul>
    </div>
    `

  const html = htmlTemplate
    .replace('<!-- REPORT -->', `${reportMeta}\n${summary}\n${issueSummary}\n${tableOfContents}\n${reportHtml || '<div class="no-issues">All links are valid! 🎉</div>'}`)
    .replaceAll('<!-- SiteName -->', `Link Report - ${useSiteConfig()?.name || ''}`)

  await storage.setItem('link-checker-report.html', html)
  return resolve(storageFilepath, 'link-checker-report.html')
}

async function generateMarkdownReport(reports: PathReport[], { storage, storageFilepath }: InspectionContext) {
  // Sort reports like a file tree (parents before children, alphabetically at each level)
  const sortedReports = [...reports].sort((a, b) => {
    const segmentsA = a.route.split('/').filter(Boolean)
    const segmentsB = b.route.split('/').filter(Boolean)
    const minLength = Math.min(segmentsA.length, segmentsB.length)

    // Compare segment by segment
    for (let i = 0; i < minLength; i++) {
      const cmp = segmentsA[i].localeCompare(segmentsB[i])
      if (cmp !== 0)
        return cmp
    }

    // If all segments match, shorter path comes first
    return segmentsA.length - segmentsB.length
  })

  // Create document header with timestamp and summary
  const timestamp = new Date().toLocaleString()
  const totalErrors = sortedReports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.error?.length).length, 0)
  const totalWarnings = sortedReports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.warning?.length).length, 0)

  const header = [
    '# Nuxt Link Checker Report',
    '',
    `**Generated:** ${timestamp}`,
    '',
    '## Summary',
    '',
    `- **Pages checked:** ${sortedReports.length}`,
    `- **Total errors:** ${totalErrors}`,
    `- **Total warnings:** ${totalWarnings}`,
    '',
    '---',
    '',
  ].join('\n')

  // Table of contents for quick navigation
  const toc = sortedReports.map(({ route }) => `- [${route}](#${createAnchor(route)})`).join('\n')
  const reportMarkdown = sortedReports
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
  const filteredReports = reports
    .map(report => ({
      ...report,
      reports: report.reports.filter(r => r.error?.length || r.warning?.length),
    }))
    .filter(report => report.reports.length > 0)

  const json = JSON.stringify(filteredReports, null, 2)
  await storage.setItem('link-checker-report.json', json)
  return resolve(storageFilepath, 'link-checker-report.json')
}
