import type Fuse from 'fuse.js'
import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import type { SiteConfigResolved } from 'site-config-stack'
import type { Storage } from 'unstorage'
import type { ModuleOptions } from '../module'
import type { LinkInspectionResult } from '../runtime/types'
import { relative, resolve } from 'pathe'

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
  if (report.html) {
    await generateHtmlReport(reports, ctx)
  }

  if (report.markdown) {
    await generateMarkdownReport(reports, ctx)
  }

  if (report.json) {
    await generateJsonReport(reports, ctx)
  }
}

async function generateHtmlReport(reports: PathReport[], { storage, storageFilepath, nuxt, nitro }: InspectionContext) {
  const reportHtml = reports
    .map(({ route, reports }) => {
      const reportsHtml = reports.map((r) => {
        const errors = r.error?.map(error =>
          `<li class="error">${error.message} (${error.name})</li>`,
        ) || []

        const warnings = r.warning?.map(warning =>
          `<li class="warning">${warning.message} (${warning.name})</li>`,
        ) || []

        const valid = (errors.length + warnings.length) === 0
        return `<li class="link"><a href="${r.link}">${r.link}</a>${!valid
          ? `<ul>${[...errors, ...warnings].join('\n')}</ul>`
          : 'Valid'}</li>`
      }).join('\n')

      const errors = reports.filter(r => r.error?.length).length
      const warnings = reports.filter(r => r.warning?.length).length
      const statusString = [
        errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : false,
        warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : false,
      ].filter(Boolean).join(', ')

      return `
      <h2><a href="${route}">${route}</a> ${statusString}</h2>
      <ul>
        ${reportsHtml}
      </ul>`
    })
    .join('')

  const html = `
    <html>
      <head>
        <title>Link Checker Report</title>
        <style>
          body { font-family: sans-serif; }
          .link { margin-bottom: 1rem; }
          .error { color: #F87171; }
          .warning { color: #FBBF24; }
        </style>
      </head>
      <body>
        <h1>Link Checker Report</h1>
        <ul>${reportHtml}</ul>
      </body>
    </html>`

  await storage.setItem('link-checker-report.html', html)
  if (storageFilepath) {
    nitro.logger.info(
      `Nuxt Link Checker HTML report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.html'))}`,
    )
  }
}

async function generateMarkdownReport(reports: PathReport[], { storage, storageFilepath, nuxt, nitro }: InspectionContext) {
  const reportMarkdown = reports
    .map(({ route, reports }) => {
      const reportsMarkdown = reports.map((r) => {
        const errors = r.error?.map(error =>
          `| ${r.link} | ${error.message} (${error.name}) |`,
        ) || []

        const warnings = r.warning?.map(warning =>
          `| ${r.link} | ${warning.message} (${warning.name}) |`,
        ) || []

        return [...errors, ...warnings].filter(Boolean)
      }).flat().filter(Boolean).join('\n')

      const errors = reports.filter(r => r.error?.length).length
      const warnings = reports.filter(r => r.warning?.length).length
      const statusString = [
        errors > 0 ? `${errors} error${errors > 1 ? 's' : ''}` : false,
        warnings > 0 ? `${warnings} warning${warnings > 1 ? 's' : ''}` : false,
      ].filter(Boolean).join(', ')

      return [
        `## [${route}](${route}) ${statusString}`,
        '| Link | Message |',
        '| --- | --- |',
        reportsMarkdown,
        '',
      ].join('\n')
    })
    .join('\n')

  const markdown = [
    '# Link Checker Report',
    '',
    reportMarkdown,
  ].join('\n')

  await storage.setItem('link-checker-report.md', markdown)
  if (storageFilepath) {
    nitro.logger.info(
      `Nuxt Link Checker Markdown report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.md'))}`,
    )
  }
}

async function generateJsonReport(reports: PathReport[], { storage, storageFilepath, nuxt, nitro }: InspectionContext) {
  const json = JSON.stringify(reports, null, 2)
  await storage.setItem('link-checker-report.json', json)

  if (storageFilepath) {
    nitro.logger.info(
      `Nuxt Link Checker JSON report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.json'))}`,
    )
  }
}
