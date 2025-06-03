import type { NuxtAnalyzeDevtoolsServerContext } from '~/packages/module/src/devtools/types'
import type { Audit } from '~/packages/module/src/types'
import { startSubprocess } from '@nuxt/devtools-kit'
import { basename, dirname, resolve } from 'pathe'

export async function startAnalyzeSubprocess(ctx: NuxtAnalyzeDevtoolsServerContext, audit: Audit) {
  const { refreshNuxtAnalyzeDevtools, nuxt, state } = ctx
  const result = startSubprocess({
    command: 'npx',
    args: ['tsx', basename(ctx.nuxtAnalyzeOptions.nuxtAnalyzeCliPath), '_analyze'],
    cwd: dirname(ctx.nuxtAnalyzeOptions.nuxtAnalyzeCliPath),
    env: {
      STORAGE_DIR: resolve(nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir as string, String(audit.id)),
    },
  }, {
    id: 'nuxt-analyze:analyze',
    name: 'Nuxt Analyze: Analyze',
    icon: 'carbon:ibm-engineering-test-mgmt',
  }, nuxt)
  nuxt.hooks.hook('close', () => {
    if (state.analyzeTaskProcess) {
      state.analyzeTaskProcess.terminate()
    }
  })
  state.analyzeTaskProcess = result.getProcess()

  audit.tasks.analyze.command = []
  audit.tasks.analyze.terminal = []
  audit.tasks.analyze.startedAt = Date.now()
  audit.tasks.analyze.status = 'running'
  audit.currentTask = 'analyze'
  audit.currentTaskStatus = 'running'
  await ctx.updateAudit(audit)

  nuxt.hooks.hook('devtools:terminal:write', async ({ id, data }) => {
    if (id === 'nuxt-analyze:analyze') {
      audit.tasks.analyze.terminal.push(data)
      // slice to top 5
      if (audit.tasks.analyze.terminal.length > 5) {
        audit.tasks.analyze.terminal.shift()
      }
      // check for success message
      if (data.includes('ESLint worker terminated gracefully')) {
        audit.tasks.analyze.status = 'done'
        audit.tasks.analyze.timeTaken = Date.now() - audit.tasks.analyze.startedAt!
        if (state.serveTaskProcess) {
          state.serveTaskProcess.terminate()
        }
      }
      await ctx.updateAudit(audit)
      refreshNuxtAnalyzeDevtools()
    }
  })
  nuxt.hooks.hook('devtools:terminal:exit', async ({ id, code }) => {
    if (id === 'nuxt-analyze:analyze') {
      if (audit.tasks.analyze.status === 'running') {
        audit.tasks.analyze.status = 'error'
        audit.tasks.analyze.error = `Exited with non-zero code ${code}.`
        audit.currentTaskStatus = 'error'
        await ctx.updateAudit(audit)
      }
      refreshNuxtAnalyzeDevtools()
    }
  })
  return result.getProcess()
}
