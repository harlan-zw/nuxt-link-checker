import type { NuxtAnalyzeDevtoolsServerContext } from '~/packages/module/src/devtools/types'
import type { Audit } from '~/packages/module/src/types'
import { readFile } from 'node:fs/promises'
import { startSubprocess } from '@nuxt/devtools-kit'
import { startCrawlSubprocess } from './crawl'

export async function startServeSubprocess(ctx: NuxtAnalyzeDevtoolsServerContext, audit: Audit) {
  const { refreshNuxtAnalyzeDevtools, nuxt, state } = ctx

  // read file dist/nitro.json
  const nitroJsonPath = nuxt.options.nitro.output?.dir ? `${nuxt.options.nitro.output.dir}/nitro.json` : 'dist/nitro.json'
  const nitroJson = JSON.parse(await readFile(nitroJsonPath, 'utf-8'))
  const command = nitroJson.commands.preview
  console.log({ command, cwd: nuxt.options.rootDir })
  // let cmd = {
  //   command: command.split(' ')[0],
  //   args: command.split(' ').slice(1),
  // }
  // if (preset.startsWith('cloudlflare')) {
  //   if (nuxt.options.modules.includes('@nuxthub/core')) {
  //     cmd = {
  //       command: 'npx',
  //       args: ['nuxthub', 'preview'],
  //     }
  //   }
  //   else if (preset === 'cloudflare-pages') {
  //     cmd = {
  //       command: 'npx',
  //       args: ['wrangler', '--cwd', '/dist', 'pages', 'dev'],
  //     }
  //   }
  //   else if (preset === 'cloudflare-worker') {
  //     cmd = {
  //       command: 'npx',
  //       args: ['wrangler', 'dev', '.output/server/index.mjs', '--site', '.output/public'],
  //     }
  //   }
  // }
  // console.log({ preset, cmd, nuxthub: nuxt.options.modules.includes('@nuxthub/core') })

  const result = startSubprocess({
    command: command.split(' ')[0],
    args: command.split(' ').slice(1),
    cwd: nuxt.options.rootDir,
    env: {
      PORT: '39999',
    },
  }, {
    id: 'nuxt-analyze:serve',
    name: 'Nuxt Analyze: Serve',
    icon: 'carbon:ibm-engineering-test-mgmt',
  }, nuxt)
  nuxt.hooks.hook('close', () => {
    if (state.serveTaskProcess) {
      state.serveTaskProcess.terminate()
    }
  })
  state.serveTaskProcess = result.getProcess()

  audit.tasks.serve.terminal = []
  audit.tasks.serve.startedAt = Date.now()
  audit.tasks.serve.status = 'running'
  audit.currentTask = 'serve'
  audit.currentTaskStatus = 'running'
  await ctx.updateAudit(audit)

  nuxt.hooks.hook('devtools:terminal:write', async ({ id, data }) => {
    if (id === 'nuxt-analyze:serve') {
      audit.tasks.serve.terminal.push(data)
      // slic e to top 5
      if (audit.tasks.serve.terminal.length > 5) {
        audit.tasks.serve.terminal.shift()
      }
      console.log({ data })
      let isFinish = false
      let origin
      if (data.includes('Listening on ')) {
        // match origin could be http or https
        const match = data.match(/Listening on (https?:\/\/\S+)/)
        console.log({ match, data })
        if (match && match[1]) {
          origin = match[1]
          isFinish = true
        }
      }
      else if (data.includes('Ready on ')) {
        // match origin could be http or https
        const match = data.match(/Ready on (https?:\/\/\S+)/)
        if (match && match[1]) {
          origin = match[1].replace(/\x1B\[\d+m/g, '')
          isFinish = true
        }
      }
      // check for success message
      if (isFinish) {
        audit.tasks.serve.status = 'done'
        audit.tasks.serve.timeTaken = Date.now() - audit.tasks.serve.startedAt!
        startCrawlSubprocess(ctx, audit, origin)
      }
      await ctx.updateAudit(audit)
      refreshNuxtAnalyzeDevtools()
    }
  })
  nuxt.hooks.hook('devtools:terminal:exit', async ({ id, code }) => {
    if (id === 'nuxt-analyze:serve') {
      if (audit.tasks.serve.status === 'running') {
        audit.tasks.serve.status = 'error'
        audit.tasks.serve.error = `Exited with non-zero code ${code}.`
        audit.currentTaskStatus = 'error'
        await ctx.updateAudit(audit)
      }
      refreshNuxtAnalyzeDevtools()
    }
  })
  return result.getProcess()
}
