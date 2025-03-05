import type { Nuxt } from 'nuxt/schema'
import type { ModuleOptions } from './module'
import { existsSync } from 'node:fs'
import { useNuxt } from '@nuxt/kit'
import { colors } from 'consola/utils'
import Fuse from 'fuse.js'
import { useSiteConfig } from 'nuxt-site-config/kit'
import { relative, resolve } from 'pathe'
import { withoutLeadingSlash } from 'ufo'
import { ELEMENT_NODE, parse, walkSync } from 'ultrahtml'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { getLinkResponse, setLinkResponse } from './runtime/shared/crawl'
import { inspect } from './runtime/shared/inspect'
import { createFilter } from './runtime/shared/sharedUtils'

const { gray, yellow, dim, red, white } = colors

const linkMap: Record<string, ExtractedPayload> = {}

interface ExtractedPayload {
  title: string
  links: { link: string, textContent: string }[]
  ids: string[]
}

export async function extractPayload(html: string, rootNodeId = '#__nuxt') {
  if (String(rootNodeId).length) {
    rootNodeId = rootNodeId[0] === '#' ? rootNodeId : `#${rootNodeId}`
  }

  const ast = parse(html
    // vue template comments that cause issues
    .replaceAll('<!--]-->', '')
    .replaceAll('<!--[-->', '')
    .replaceAll('<!---->', '')
    // ultrahtml can't pass this (from tailwind)
    .replaceAll('&amp;>', '&amp;&gt;')
  )
  const title: string[] = []
  const ids: string[] = []
  const links: { role: string, link: string, textContent: string }[] = []

  let enteredRoot = !rootNodeId
  walkSync(ast, (node) => {
    if (node.attributes?.id === rootNodeId.substring(1)) {
      enteredRoot = true
    }
    if (!enteredRoot) {
      return
    }
    // Extract title
    if (node.type === ELEMENT_NODE && node.name === 'title') {
      if (node.children && node.children.length > 0) {
        title.push(node.children[0].value || '')
      }
    }

    // Extract IDs from elements inside rootNodeId
    if (node.type === ELEMENT_NODE && node.attributes?.id && isNodeInsideRoot(node, rootNodeId)) {
      ids.push(node.attributes.id)
    }

    // Extract links from elements inside rootNodeId
    if (node.type === ELEMENT_NODE && node.name === 'a' && isNodeInsideRoot(node, rootNodeId)) {
      links.push({
        role: node.attributes?.role || '',
        link: node.attributes?.href || '',
        textContent: getTextContent(node),
      })
    }
  })

  return { title: title[0] || '', ids, links }
}

// Helper function to check if a node is inside the root element
function isNodeInsideRoot(node: any, rootNodeId: string): boolean {
  // Simple implementation - in a real scenario, you would need to traverse up the tree
  // This is a placeholder and should be replaced with proper DOM traversal
  if (rootNodeId.startsWith('#') && node.attributes?.id === rootNodeId.substring(1)) {
    return true
  }
  return true // Simplified for now, would need proper implementation
}

// Helper function to get text content from node
function getTextContent(node: any): string {
  const text: string[] = []

  if (typeof node.value === 'string' && node.value) {
    return node.value
  }

  if (node.attributes?.['aria-label'])
    return node.attributes['aria-label']
  if (node.attributes?.title)
    return node.attributes.title

  // Extract text from children
  if (node.children) {
    for (const child of node.children) {
      text.push(getTextContent(child))
    }
  }

  return text.filter(Boolean).map(s => s.trim()).join(' ')
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
        linkMap[route] = extractPayload(ctx.contents, nuxt.options.app.rootAttrs?.id || '')

      setLinkResponse(route, Promise.resolve({ status: Number(ctx.error?.statusCode) || 200, statusText: ctx.error?.statusMessage || '', headers: {} }))
    })
    nitro.hooks.hook('prerender:done', async () => {
      const payloads = Object.entries(linkMap)
      if (!payloads.length)
        return

      const storageFilepath = typeof config.report?.storage === 'string' ? resolve(nuxt.options.rootDir, config.report?.storage) : nitro.options.output.dir
      const storage = createStorage(config.report?.storage && typeof config.report.storage !== 'string'
        ? config.report?.storage
        : {
            driver: fsDriver({
              base: storageFilepath,
            }),
          })

      const links = payloads.map(([route, payload]) => {
        return {
          link: route,
          title: payload.title,
        }
      }).flat()
      const pageSearcher = new Fuse<{ link: string, title: string }>(links, {
        keys: ['link', 'title'],
        threshold: 0.5,
      })
      nitro.logger.info('Running link inspections...')
      let routeCount = 0
      let errorCount = 0
      const allReports = (await Promise.all(payloads.map(async ([route, payload]) => {
        const reports = await Promise.all(payload.links.map(async ({ link, textContent }) => {
          if (!urlFilter(link) || !link)
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
            errors > 0 ? red(`${errors} error${errors > 1 ? 's' : ''}`) : false,
            warnings > 0 ? yellow(`${warnings} warning${warnings > 1 ? 's' : ''}`) : false,
          ].filter(Boolean).join(gray(', '))
          nitro.logger.log(gray(
            `  ${Number(++routeCount) === payload.links.length - 1 ? '└─' : '├─'} ${white(route)} ${gray('[')}${statusString}${gray(']')}`,
          ))
          // show inspection results
          reports.forEach((report) => {
            if (report.error?.length || report.warning?.length) {
              nitro.logger.log(dim(`    ${report.textContent} ${report.link}`))
              report.error?.forEach((error) => {
                // show code
                nitro.logger.log(red(`        ✖ ${error.message}`) + gray(` (${error.name})`))
                if (error.fix)
                  nitro.logger.log(gray(`          ${error.fixDescription}`))
              })
              report.warning?.forEach((warning) => {
                nitro.logger.log(yellow(`        ⚠ ${warning.message}`) + gray(` (${warning.name})`))
                if (warning.fix)
                  nitro.logger.log(gray(`          ${warning.fixDescription}`))
              })
            }
          })
        }
        return { route, reports }
      }))).flat()
      const reportsWithContent = allReports.filter(({ reports }) => reports.some(r => r.error?.length || r.warning?.length))
      // emit a html report
      if (config.report?.html) {
        const reportHtml = reportsWithContent
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
          })
          .join('')
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
        await storage.setItem('link-checker-report.html', html)
        if (storageFilepath) {
          nitro.logger.info(`Nuxt Link Checker HTML report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.html'))}`)
        }
      }
      if (config.report?.markdown) {
        const reportMarkdown = reportsWithContent
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
          })
          .join('\n')
        const markdown = [
          '# Link Checker Report',
          '',
          reportMarkdown,
        ].join('\n')
        // write file
        await storage.setItem('link-checker-report.md', markdown)
        if (storageFilepath) {
          nitro.logger.info(`Nuxt Link Checker Markdown report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.md'))}`)
        }
      }
      if (config.report?.json) {
        const json = JSON.stringify(reportsWithContent, null, 2)
        // write file
        await storage.setItem('link-checker-report.json', json)
        if (storageFilepath) {
          nitro.logger.info(`Nuxt Link Checker JSON report written to ./${relative(nuxt.options.rootDir, resolve(storageFilepath, 'link-checker-report.json'))}`)
        }
      }
      if (errorCount > 0 && config.failOnError) {
        nitro.logger.error(`Nuxt Link Checker found ${errorCount} errors, failing build.`)
        nitro.logger.log(gray('You can disable this by setting "linkChecker: { failOnError: false }" in your nuxt.config.'))
        process.exit(1)
      }
    })
  })
}
