import fs from 'node:fs/promises'
import chalk from 'chalk'
import { useNuxt } from '@nuxt/kit'
import { useSiteConfig } from 'nuxt-site-config-kit'
import Fuse from 'fuse.js'
import { resolve } from 'pathe'
import { load } from 'cheerio'
import type { ModuleOptions } from './module'
import { createFilter } from './urlFilter'
import { inspect } from './runtime/inspect'
import { crawlFetch } from './runtime/sharedUtils'

const responses: Record<string, Promise<{ status: number; statusText: string }>> = {}
const linkMap: Record<string, ExtractedPayload> = {}

interface ExtractedPayload {
  links: string[]
  ids: string[]
}
export function extractPayload(html: string) {
  const $ = load(html)
  const ids = $('#__nuxt [id]').map((i, el) => $(el).attr('id')).get()
  const links = $('#__nuxt a[href]').map((i, el) => $(el).attr('href')).get()
  return { ids, links }
}

async function getLinkResponse(link: string, timeout: number) {
  const response = responses[link]
  if (!response) {
    // do fetch
    responses[link] = crawlFetch(link, { timeout })
  }
  return responses[link]
}

export function prerender(config: ModuleOptions, nuxt = useNuxt()) {
  // only runs when we build
  // @todo
  const urlFilter = createFilter({
    exclude: config.excludeLinks,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    const siteConfig = useSiteConfig()
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      if (ctx.contents && !ctx.error && ctx.fileName?.endsWith('.html') && !ctx.route.endsWith('.html') && urlFilter(ctx.route)) {
        linkMap[ctx.route] = extractPayload(ctx.contents)
        linkMap[ctx.route].links.forEach((link) => {
          getLinkResponse(link, config.fetchTimeout)
        })
      }
      responses[ctx.route] = Promise.resolve({ status: Number(ctx.error?.statusCode) || 200, statusText: ctx.error?.statusMessage || '' })
    })
    nitro.hooks.hook('close', async () => {
      const payloads = Object.entries(linkMap)
      if (!payloads.length)
        return
      const links = payloads.map(([, payloads]) => payloads.links).flat()
      const pageSearcher = new Fuse(links, {
        threshold: 0.5,
      })
      nitro.logger.info('Running link inspections...')
      let routeCount = 0
      let errorCount = 0
      await Promise.all(payloads.map(async ([route, payload]) => {
        const reports = await Promise.all(payload.links.map(async (link) => {
          const response = await getLinkResponse(link)
          return inspect({
            ids: linkMap[route].ids,
            fromPath: route,
            pageSearch: pageSearcher,
            siteConfig,
            link,
            response,
            skipInspections: config.skipInspections,
          })
        }))
        const valid = !reports.filter(r => !r.passes).length
        if (valid)
          return
        const errors = reports.filter(r => r.error?.length).length
        errorCount += errors
        const warnings = reports.filter(r => r.warning?.length).length
        const statusString = [
          errors > 0 ? chalk.red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
          warnings > 0 ? chalk.yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
        ].filter(Boolean).join(chalk.gray(', '))
        nitro.logger.log(chalk.gray(
            `  ${Number(++routeCount) === payload.links.length - 1 ? '└─' : '├─'} ${chalk.white(route)} ${chalk.gray('[')}${statusString}${chalk.gray(']')}`,
        ))
        // show inspection results
        reports.forEach((report) => {
          if (!report.passes) {
            nitro.logger.log(chalk.gray(`    ${report.link}`))
            report.error?.forEach((error) => {
              // show code
              nitro.logger.log(chalk.red(`        ✖ ${error.message}`) + chalk.gray(` (${error.name})`))
            })
            report.warning?.forEach((warning) => {
              nitro.logger.log(chalk.yellow(`        ⚠ ${warning.message}`) + chalk.gray(` (${warning.name})`))
            })
          }
        })
        // emit a html report
        if (config.report?.html) {
          if (reports.length) {
            // going to render a markdown table result for GitHub
            const reportHtml = reports.map((r) => {
              const errors = r.error?.map((error) => {
                return `<li class="error">${error.message} (${error.name})</li>`
              }).join('')
              const warnings = r.warning?.map((warning) => {
                return `<li class="warning">${warning.message} (${warning.name})</li>`
              }).join('')
              return `<li class="link"><a href="${r.link}">${r.link}</a><ul>${errors}${warnings}</ul></li>`
            }).join('')
            const html = `
                <html>
                    <head>
                    <title>Link Checker Report</title>
                    <style>
                        body {
                        font-family: sans-serif;
                        }
                        .link {
                        margin-bottom: 1rem;
                        }
                        .error {
                        color: red;
                        }
                        .warning {
                        color: yellow;
                        }
                    </style>
                    </head>
                    <body>
                    <h1>Link Checker Report</h1>
                    <ul>
                        ${reportHtml}
                    </ul>
                    </body>
                </html>
                `
            // write file
            await fs.writeFile(resolve(nitro.options.output.dir, 'link-checker-report.html'), html)
            nitro.logger.info(`Nuxt Link Checker Report written to ${resolve(nitro.options.output.dir, 'link-checker-report.html')}`)
          }
        }
        if (config.report?.markdown) {
          // markdown report for github
          if (reports.length) {
            // going to render a markdown table result for GitHub
            const reportMarkdown = reports.map((r) => {
              const errors = r.error?.map((error) => {
                return `| ${r.link} | ${error.message} (${error.name}) |`
              }).join('')
              const warnings = r.warning?.map((warning) => {
                return `| ${r.link} | ${warning.message} (${warning.name}) |`
              }).join('')
              return `${errors}${warnings}`
            }).join('')
            const markdown = [
              '# Link Checker Report',
              '',
              '| Link | Message |',
              '| --- | --- |',
              reportMarkdown,
            ].join('\n')
            // write file
            await fs.writeFile(resolve(nitro.options.output.dir, 'link-checker-report.md'), markdown)
            nitro.logger.info(`Nuxt Link Checker Report written to ${resolve(nitro.options.output.dir, 'link-checker-report.md')}`)
          }
        }
      }))
      if (errorCount > 0 && config.failOnError) {
        nitro.logger.error(`Nuxt Link Checker found ${errorCount} errors, failing build.`)
        nitro.logger.log(chalk.gray('You can disable this by setting "linkChecker: { failOn404: false }" in your nuxt.config.ts.'))
        process.exit(1)
      }
    })
  })
}
