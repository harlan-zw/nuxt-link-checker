import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import chalk from 'chalk'
import { useNuxt } from '@nuxt/kit'
import { useSiteConfig } from 'nuxt-site-config-kit'
import Fuse from 'fuse.js'
import { relative, resolve } from 'pathe'
import { load } from 'cheerio'
import type { Nuxt } from 'nuxt/schema'
import { withoutLeadingSlash } from 'ufo'
import type { ModuleOptions } from './module'
import { inspect } from './runtime/pure/inspect'
import { createFilter } from './runtime/pure/sharedUtils'
import { getLinkResponse, setLinkResponse } from './runtime/pure/crawl'

const linkMap: Record<string, ExtractedPayload> = {}

interface ExtractedPayload {
  links: { link: string, textContent: string }[]
  ids: string[]
}
export function extractPayload(html: string) {
  const $ = load(html)
  const ids = $('#__nuxt [id]').map((i, el) => $(el).attr('id')).get()
  const links = $('#__nuxt a[href]').map((i, el) => {
    return {
      link: $(el).attr('href'),
      textContent: ($(el).attr('aria-label') || $(el).attr('title') || $(el).text()).trim() || '',
    }
  }).get()
    // make sure the link has a href
    .filter(l => !!l.link)
  return { ids, links }
}

export function isNuxtGenerate(nuxt: Nuxt = useNuxt()) {
  return nuxt.options._generate || nuxt.options.nitro.static || nuxt.options.nitro.preset === 'static'
}

export function prerender(config: ModuleOptions, nuxt = useNuxt()) {
  const urlFilter = createFilter({
    exclude: config.excludeLinks,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    const siteConfig = useSiteConfig()
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      const route = decodeURI(ctx.route)
      if (ctx.contents && !ctx.error && ctx.fileName?.endsWith('.html') && !route.endsWith('.html') && urlFilter(route))
        linkMap[route] = extractPayload(ctx.contents)

      setLinkResponse(route, Promise.resolve({ status: Number(ctx.error?.statusCode) || 200, statusText: ctx.error?.statusMessage || '', headers: {} }))
    })
    nitro.hooks.hook('prerender:done', async () => {
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
      const allReports = (await Promise.all(payloads.map(async ([route, payload]) => {
        const reports = await Promise.all(payload.links.map(async ({ link, textContent }) => {
          if (!urlFilter(link))
            return { error: [], warning: [], link }

          const response = await getLinkResponse({
            link,
            timeout:
            config.fetchTimeout,
            fetchRemoteUrls: config.fetchRemoteUrls,
            isInStorage() {
              return existsSync(resolve(nuxt.options.rootDir, nuxt.options.dir.public, withoutLeadingSlash(link)))
            },
          })
          return inspect({
            ids: linkMap[route].ids,
            fromPath: route,
            pageSearch: pageSearcher,
            siteConfig,
            link,
            textContent,
            response,
            skipInspections: config.skipInspections,
          })
        }))
        const errors = reports.filter(r => r.error?.length).length
        errorCount += errors
        const warnings = reports.filter(r => r.warning?.length).length
        // only show debug if there's issues
        if (errors || warnings) {
          const statusString = [
            errors > 0 ? chalk.red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
            warnings > 0 ? chalk.yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
          ].filter(Boolean).join(chalk.gray(', '))
          nitro.logger.log(chalk.gray(
            `  ${Number(++routeCount) === payload.links.length - 1 ? '└─' : '├─'} ${chalk.white(route)} ${chalk.gray('[')}${statusString}${chalk.gray(']')}`,
          ))
          // show inspection results
          reports.forEach((report) => {
            if (report.error?.length || report.warning?.length) {
              nitro.logger.log(chalk.dim(`    ${report.textContent} ${report.link}`))
              report.error?.forEach((error) => {
                // show code
                nitro.logger.log(chalk.red(`        ✖ ${error.message}`) + chalk.gray(` (${error.name})`))
              })
              report.warning?.forEach((warning) => {
                nitro.logger.log(chalk.yellow(`        ⚠ ${warning.message}`) + chalk.gray(` (${warning.name})`))
              })
            }
          })
        }
        return { route, reports }
      }))).flat()
      // emit a html report
      if (config.report?.html) {
        const reportHtml = allReports
          .map(({ route, reports }) => {
            const reportsHtml = reports.map((r) => {
              const errors = r.error?.map((error) => {
                return `<li class="error">${error.message} (${error.name})</li>`
              }) || []
              const warnings = r.warning?.map((warning) => {
                return `<li class="warning">${warning.message} (${warning.name})</li>`
              }) || []
              const valid = (errors.length + warnings.length) === 0
              return `<li class="link"><a href="${r.link}">${r.link}</a>${!valid ? `<ul>${[...errors, ...warnings].join('\n')}</ul>` : 'Valid'}</li>`
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
            </ul>
            `
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
                        /* use a modern, tailwind colour pallet for .error and .warning, do not use red or yellow */
                        .error {
                            color: #F87171;
                        }
                        .warning {
                            color: #FBBF24;
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
        nitro.logger.info(`Nuxt Link Checker HTML report written to ${relative(nuxt.options.rootDir, resolve(nitro.options.output.dir, 'link-checker-report.html'))}`)
      }
      if (config.report?.markdown) {
        const reportMarkdown = allReports
          .map(({ route, reports }) => {
            const reportsMarkdown = reports.map((r) => {
              const errors = r.error?.map((error) => {
                return `| ${r.link} | ${error.message} (${error.name}) |`
              }) || []
              const warnings = r.warning?.map((warning) => {
                return `| ${r.link} | ${warning.message} (${warning.name}) |`
              }) || []
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
          }).join('\n')
        const markdown = [
          '# Link Checker Report',
          '',
          reportMarkdown,
        ].join('\n')
        // write file
        await fs.writeFile(resolve(nitro.options.output.dir, 'link-checker-report.md'), markdown)
        nitro.logger.info(`Nuxt Link Checker Markdown report written to ${relative(nuxt.options.rootDir, resolve(nitro.options.output.dir, 'link-checker-report.md'))}`)
      }
      if (errorCount > 0 && config.failOnError) {
        nitro.logger.error(`Nuxt Link Checker found ${errorCount} errors, failing build.`)
        nitro.logger.log(chalk.gray('You can disable this by setting "linkChecker: { failOnError: false }" in your nuxt.config.'))
        process.exit(1)
      }
    })
  })
}
