import type { Audit } from '../../types'
import type { NuxtAnalyzeDevtoolsServerContext } from '~/packages/module/src/devtools/types'
import { startSubprocess } from '@nuxt/devtools-kit'
import { basename, dirname, resolve } from 'pathe'
import { startAnalyzeSubprocess } from './analyze'

export async function startCrawlSubprocess(ctx: NuxtAnalyzeDevtoolsServerContext, audit: Audit, origin: string) {
  const { refreshNuxtAnalyzeDevtools, nuxt, state } = ctx
  console.log('@@@ crawl', { origin, audit, dir: nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir })
  const result = startSubprocess({
    command: 'npx',
    args: ['tsx', basename(ctx.nuxtAnalyzeOptions.nuxtAnalyzeCliPath), '_crawl', '--url', origin],
    cwd: dirname(ctx.nuxtAnalyzeOptions.nuxtAnalyzeCliPath),
    env: {
      STORAGE_DIR: resolve(nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir as string, String(audit.id)),
      CRAWLEE_STORAGE_DIR: resolve(ctx.nuxt.options.rootDir, `node_modules/.cache/nuxt/analyze/${audit.id}`),
    },
  }, {
    id: 'nuxt-analyze:crawl',
    name: 'Nuxt Analyze: Crawl',
    icon: 'carbon:ibm-engineering-test-mgmt',
  }, nuxt)
  nuxt.hooks.hook('close', () => {
    if (state.crawlTaskProcess) {
      state.crawlTaskProcess.terminate()
    }
  })
  state.crawlTaskProcess = result.getProcess()

  audit.tasks.crawl.terminal = []
  audit.tasks.crawl.startedAt = Date.now()
  audit.tasks.crawl.status = 'running'
  audit.currentTask = 'crawl'
  audit.currentTaskStatus = 'running'
  await ctx.updateAudit(audit)

  nuxt.hooks.hook('devtools:terminal:write', async ({ id, data }) => {
    if (id === 'nuxt-analyze:crawl') {
      audit.tasks.crawl.terminal.push(data)
      // slic e to top 5
      if (audit.tasks.crawl.terminal.length > 5) {
        audit.tasks.crawl.terminal.shift()
      }
      // check for success message
      if (data.includes('Finished!')) {
        console.log('finishing!!')
        audit.tasks.crawl.status = 'done'
        audit.tasks.crawl.timeTaken = Date.now() - audit.tasks.crawl.startedAt!
        // we may not have a serve process if we're on dev scan
        if (state.serveTaskProcess) {
          state.serveTaskProcess.terminate()
        }
        startAnalyzeSubprocess(ctx, audit)
      }
      else if (data.includes('ESLint worker error')) {
        audit.tasks.crawl.status = 'error'
        audit.tasks.crawl.error = data
        audit.currentTaskStatus = 'error'
        state.crawlTaskProcess.terminate()
      }
      await ctx.updateAudit(audit)
      refreshNuxtAnalyzeDevtools()
    }
  })
  nuxt.hooks.hook('devtools:terminal:exit', async ({ id, code }) => {
    if (id === 'nuxt-analyze:crawl') {
      console.log('terminatingh!!')
      if (audit.tasks.crawl.status === 'running') {
        audit.tasks.crawl.status = 'error'
        audit.tasks.crawl.error = `Exited with non-zero code ${code}.`
        audit.currentTaskStatus = 'error'
        await ctx.updateAudit(audit)
      }
      refreshNuxtAnalyzeDevtools()
    }
  })
  return result.getProcess()
}
