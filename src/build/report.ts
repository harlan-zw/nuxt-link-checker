import type Fuse from 'fuse.js'
import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { SiteConfigResolved } from 'site-config-stack'
import type { Storage } from 'unstorage'
import type { ModuleOptions } from '../module'
import type { LinkInspectionResult } from '../runtime/types'
import { relative, resolve } from 'pathe'
import { htmlTemplate } from './template'
import { useSiteConfig } from 'nuxt-site-config-kit'

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
    ctx.nitro.logger.info(
      `[Nuxt Link Checker] Reports written to: ${reportPaths.map(r => `\`${relative(process.cwd(), r)}\``).join(', ')}`,
    )
  }
}

async function generateHtmlReport(reports: PathReport[], { storage, storageFilepath }: InspectionContext) {
  const timestamp = new Date().toLocaleString()
  const totalErrors = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.error?.length).length, 0)
  const totalWarnings = reports.reduce((sum, { reports }) =>
    sum + reports.filter(r => r.warning?.length).length, 0)

  // Get package version - you can add this to your module context
  const version = process.env.npm_package_version || '1.0.0'
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
          <span class="stat-label">Pages checked</span>
          <span class="stat-value">${reports.length}</span>
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
        <a href="#route-${createAnchor(route)}">${statusEmoji} ${route}</a>
        ${statusString ? `<span class="toc-status">(${statusString})</span>` : ''}
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
    <div id="toc" class="table-of-contents">
      <h2>Table of Contents</h2>
      <ul class="toc-list">
        ${tocHtml || '<li>No issues found</li>'}
      </ul>
    </div>
    `

  const html = htmlTemplate
    .replace('<!-- REPORT -->', `${reportMeta}\n${summary}\n${tableOfContents}\n${reportHtml || '<div class="no-issues">All links are valid! 🎉</div>'}`)
    .replaceAll('<!-- SiteName -->', `Link Report - ${useSiteConfig()?.name || ''}`)

  await storage.setItem('link-checker-report.html', html)
  return resolve(storageFilepath, 'link-checker-report.html')
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
