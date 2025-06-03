import { cac } from 'cac'

export interface CrawlOptions {
  url: string
}

const cli = cac('nuxt-analyze')

cli.command('_crawl', 'Crawl a site')
  .option('--url <site>', 'The site to crawl')
  .action(async (args) => {
    const { commandCrawl } = await import('./commands/crawl')
    await commandCrawl(args)
  })

cli.command('_analyze', 'Analyze a site')
  .action(async (args) => {
    const { commandAnalyze } = await import('./commands/analyze')
    await commandAnalyze(args)
  })

cli.command('_db <name>', 'Setup the database')
  .action(async (name) => {
    console.log(name)
    const { commandDb } = await import('./commands/db')
    await commandDb(name)
  })

cli.command('')
  .action(() => {
    throw new Error('Unknown command, expected `crawl` command.')
  })

cli
  .help()
  .parse()
