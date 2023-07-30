import chalk from 'chalk'
import { useNuxt } from '@nuxt/kit'
import { extractLinks, linkMap } from './extractLinks'
import type { ModuleOptions } from './module'
import { createFilter } from './urlFilter'

const invalidStatusCodes = [404, 302, 301, 307, 303]

export function prerender(config: ModuleOptions, nuxt = useNuxt()) {
  // only runs when we build
  const urlFilter = createFilter({
    exclude: config.exclude,
  })
  nuxt.hooks.hook('nitro:init', async (nitro) => {
    const invalidRoutes: Record<string, number> = {}
    nitro.hooks.hook('prerender:generate', async (ctx) => {
      if (ctx.contents && ctx.fileName?.endsWith('.html'))
        linkMap[ctx.route] = extractLinks(ctx.contents, ctx.route, config)
      if (ctx.error?.statusCode && invalidStatusCodes.includes(Number(ctx.error?.statusCode as number)))
        invalidRoutes[ctx.route] = ctx.error.statusCode
    })
    nitro.hooks.hook('close', async () => {
      const links = Object.entries(linkMap)
      if (!links.length)
        return
      nitro.logger.info(`Scanning routes for broken links... ${chalk.gray(`trailingSlashes: ${config.trailingSlash ? '\`true\`' : '\`false\`'}`)}`)
      let routeCount = 0
      let badLinkCount = 0
      links.forEach(([route, routes]) => {
        const brokenLinks = routes.map((r) => {
          return {
            ...r,
            statusCode: invalidRoutes[r.pathname] || 200,
          }
        })
          .filter(r => r.statusCode !== 200 || r.badTrailingSlash || r.badAbsolute)
        // make sure we aren't ignoring it
          .filter(r => urlFilter(r.pathname))
        if (brokenLinks.length) {
          nitro.logger.log(chalk.gray(
                        `  ${Number(++routeCount) === links.length - 1 ? '└─' : '├─'} ${chalk.white(route)}`,
          ))
          brokenLinks.forEach((link) => {
            badLinkCount++
            nitro.logger.log('')
            if (link.statusCode !== 200) {
              nitro.logger.log(chalk.red(
                                `   ${link.statusCode} ${link.statusCode === 404 ? 'Not Found' : 'Redirect'}`,
              ))
            }
            else if (link.badAbsolute) {
              nitro.logger.log(chalk.yellow(
                '   Absolute link, should be relative',
              ))
            }
            else if (link.badTrailingSlash) {
              nitro.logger.log(chalk.yellow(
                '   Incorrect trailing slash',
              ))
            }
            nitro.logger.log(`   ${chalk.gray(link.element)}`)
          })
        }
      })
      if (badLinkCount > 0) {
        nitro.logger[config.failOn404 ? 'error' : 'warn'](`Found ${badLinkCount} broken links.`)
        if (config.failOn404) {
          nitro.logger.log(chalk.gray('You can disable this by setting "linkChecker: { failOn404: false }" in your nuxt.config.ts.'))
          process.exit(1)
        }
      }
      else {
        nitro.logger.success('Looks good! No broken links found.')
      }
    })
  })
}
