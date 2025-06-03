import type { ExecaChildProcess } from 'execa'
import type { CreateAuditDefaults, NuxtAnalyzeDevtoolsServerContext, WorkerFunctions } from '../types'
import type { Audit } from '~/packages/module/src/types'
import { useSiteConfig } from 'nuxt-site-config/kit'
import { resolve } from 'pathe'
import Git from 'simple-git'
import { pageRules, pages } from '../../db/audit/schema'
import { useDrizzle } from '../../db/db'
import { startAnalyzeSubprocess } from '../subprocess/analyze'
import { startBuildSubprocess } from '../subprocess/build'
import { startCrawlSubprocess } from '../subprocess/crawl'
import { startServeSubprocess } from '../subprocess/serve'

export function setupAuditRpc(ctx: NuxtAnalyzeDevtoolsServerContext) {
  const { queryAllAudits, nuxt } = ctx
  return {
    async getAuditResults(id: number) {
      const dbPath = resolve(nuxt.options.runtimeConfig.nuxtAnalyze!.storageDir as string, String(id), 'crawl.sqlite3')
      try {
        const db = await useDrizzle(dbPath)
        const allPages = await db.select().from(pages)
        console.log(allPages[0])
        const allRules = await db.select().from(pageRules)
        const meta = allPages.map((item) => {
          return {
            ...item,
            lintResult: {
              messages: allRules.filter(rule => rule.pageId === item.pageId),
            },
          }
        })
        return meta
      }
      catch (error) {
        // If database doesn't exist yet (audit hasn't been crawled), return empty results
        console.warn(`Audit database not found for audit ${id}:`, error.message)
        return []
      }
    },
    queryAllAudits: queryAllAudits,
    async createAudit(auditInput) {
      const newAudit = await ctx.createAudit(auditInput)

      // Start the appropriate subprocess based on scan type
      if (newAudit.scanType === 'default') {
        startBuildSubprocess(ctx, newAudit)
      }
      else {
        let origin = newAudit.origin
        if (newAudit.scanType === 'development') {
          origin = JSON.parse(import.meta.env.__NUXT_DEV__).publicURLs[0]
        }
        else if (newAudit.scanType === 'live') {
          origin = useSiteConfig().url
        }
        startCrawlSubprocess(ctx, newAudit, origin)
      }
      return newAudit
    },
    async retryTask(id: number, task: keyof Audit['tasks']) {
      const scans = await queryAllAudits()
      const scan = scans.find((scan) => {
        return scan.id === id
      })
      if (!scan) {
        throw new Error(`Audit with id ${id} not found`)
      }
      // sync to scan
      scan.currentTaskStatus = 'pending'
      scan.currentTask = task
      let resetTasks: (keyof Audit['tasks'])[] = []
      switch (task) {
        case 'serve':
          resetTasks = ['crawl', 'analyze']
          break
        case 'crawl':
          resetTasks = ['analyze']
          break
        case 'build':
          resetTasks = ['serve', 'crawl', 'analyze']
          break
      }
      scan.tasks[task] = {
        status: 'pending',
        terminal: [],
      }
      for (const resetTask of resetTasks) {
        scan.tasks[resetTask] = {
          status: 'pending',
          terminal: [],
        }
      }
      // save
      await ctx.updateAudit(scan)
      ctx.refreshNuxtAnalyzeDevtools()
      // wait for 1s
      await new Promise(resolve => setTimeout(resolve, 1000))
      switch (task) {
        case 'build':
          startBuildSubprocess(ctx, scan)
          break
        case 'serve':
          startServeSubprocess(ctx, scan)
          break
        case 'crawl': {
          let origin = scan.origin
          if (scan.scanType === 'development') {
            origin = JSON.parse(import.meta.env.__NUXT_DEV__).publicURLs[0]
          }
          else if (scan.scanType === 'live') {
            origin = useSiteConfig().url
          }
          console.log('retrying crawl', scan.scanType, scan.origin, origin)
          await startCrawlSubprocess(ctx, scan, origin)
          break
        }
        case 'analyze':
          startAnalyzeSubprocess(ctx, scan)
          break
      }
    },
    async terminateTask(id: number, task: keyof Audit['tasks']) {
      const scans = await queryAllAudits()
      const scan = scans.find((scan) => {
        return scan.id === id
      })
      if (!scan) {
        throw new Error(`Audit with id ${id} not found`)
      }

      // Determine which process to terminate based on task
      const { state } = ctx
      let processToTerminate: ExecaChildProcess | null = null

      switch (task) {
        case 'build':
          processToTerminate = state.buildTaskProcess
          break
        case 'serve':
          processToTerminate = state.serveTaskProcess
          break
        case 'crawl':
          processToTerminate = state.crawlTaskProcess
          break
        case 'analyze':
          processToTerminate = state.analyzeTaskProcess
          break
      }

      // Terminate the process if it exists
      if (processToTerminate) {
        console.log('got process', { processToTerminate })
        try {
          // Try different termination methods
          if (typeof processToTerminate.terminate === 'function') {
            console.log('Using terminate()')
            processToTerminate.terminate()
          }
          else if (typeof processToTerminate.kill === 'function') {
            console.log('Using kill()')
            processToTerminate.kill('SIGTERM')
          }
          else if (processToTerminate.pid) {
            console.log('Using process.kill() with PID:', processToTerminate.pid)
            process.kill(processToTerminate.pid, 'SIGTERM')
          }
        }
        catch (error) {
          console.error('Failed to terminate process:', error)
        }
        // Clear the process reference
        switch (task) {
          case 'build':
            state.buildTaskProcess = null
            break
          case 'serve':
            state.serveTaskProcess = null
            break
          case 'crawl':
            state.crawlTaskProcess = null
            break
          case 'analyze':
            state.analyzeTaskProcess = null
            break
        }
      }

      // Update the task status to stopped
      scan.tasks[task] = {
        status: 'stopped',
        terminal: scan.tasks[task].terminal || [],
        timeTaken: scan.tasks[task].startedAt ? Date.now() - scan.tasks[task].startedAt : undefined,
        error: 'Task was stopped by user',
      }

      // Update current task status if this was the current task
      if (scan.currentTask === task) {
        scan.currentTaskStatus = 'stopped'
      }

      // Save changes
      await ctx.updateAudit(scan)
      ctx.refreshNuxtAnalyzeDevtools()
    },
    // copied from nuxt devtools
    // credits to anthony fu
    async generateCreateDefaults() {
      const iso = new Date().toISOString().replace(/:/g, '-')
      const config = useSiteConfig()
      let gitName = ''
      try {
        const git = Git(nuxt.options.rootDir)
        const branch = await git.branch()
        const branchName = branch.current || 'head'
        const sha = await git.revparse(['--short', 'HEAD'])
        const isWorkingTreeClean = (await git.status()).isClean()
        if (isWorkingTreeClean)
          gitName = `${branchName}#${sha}`
        else
          gitName = `${branchName}#${sha}-dirty`
      }
      catch {
        gitName = iso
      }
      const payload: CreateAuditDefaults = {
        name: {
          default: gitName,
          live: `${config.url}-${iso}`,
          development: gitName,
        },
        origin: {
          default: '',
          live: config.url,
          development: JSON.parse(import.meta.env.__NUXT_DEV__).publicURLs[0] || config.url,
        },
      }
      return payload
    },
  } satisfies WorkerFunctions
}
