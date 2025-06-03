import type { NuxtAnalyzeDevtoolsServerContext } from '../types'
import type { Audit } from '~/packages/module/src/types'
import { startSubprocess } from '@nuxt/devtools-kit'
import { startServeSubprocess } from './serve'

export async function startBuildSubprocess(ctx: NuxtAnalyzeDevtoolsServerContext, audit: Audit) {
  const { refreshNuxtAnalyzeDevtools, nuxt, state } = ctx
  const result = startSubprocess({
    command: 'npx',
    args: ['nuxi', 'build'],
    cwd: nuxt.options.rootDir,
    env: {
      NUXT_ANALYZE_SUBPROCESS: 'true',
    },
  }, {
    id: 'nuxt-analyze:build',
    name: 'Nuxt Analyze: Build',
    icon: 'carbon:ibm-engineering-test-mgmt',
  }, nuxt)
  state.buildTaskProcess = result.getProcess()
  nuxt.hooks.hook('close', async () => {
    if (state.buildTaskProcess) {
      audit.tasks.build.status = 'error'
      audit.tasks.build.error = 'Nuxt terminated before build could complete'
      await ctx.updateAudit({
        ...audit,
        currentTaskStatus: 'error',
      })
      state.buildTaskProcess.terminate()
    }
  })
  audit.tasks.build.terminal = []
  audit.tasks.build.startedAt = Date.now()
  audit.tasks.build.status = 'running'
  audit.currentTask = 'build'
  audit.currentTaskStatus = 'running'
  await ctx.updateAudit(audit)
  nuxt.hooks.hook('devtools:terminal:write', async ({ id, data }) => {
    if (id === 'nuxt-analyze:build') {
      audit.tasks.build.terminal.push(data)
      // slic e to top 5
      if (audit.tasks.build.terminal.length > 5) {
        audit.tasks.build.terminal.shift()
      }
      // check for success message
      if (data.includes('You can preview this build using')) {
        audit.tasks.build.status = 'done'
        audit.tasks.build.timeTaken = Date.now() - audit.tasks.build.startedAt!
        startServeSubprocess(ctx, audit)
      }
      await ctx.updateAudit(audit)
      refreshNuxtAnalyzeDevtools()
    }
  })
  nuxt.hooks.hook('devtools:terminal:exit', async ({ id, code }) => {
    if (id === 'nuxt-analyze:build') {
      if (audit.tasks.build.status === 'running') {
        audit.tasks.build.status = 'error'
        audit.tasks.build.error = `Exited with non-zero code ${code}.`
        audit.currentTaskStatus = 'error'
        await ctx.updateAudit(audit)
      }
      refreshNuxtAnalyzeDevtools()
    }
  })
  return result.getProcess()
}
