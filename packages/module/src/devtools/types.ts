import type { NuxtDevtoolsServerContext } from '@nuxt/devtools-kit/types'
import type { ExecaChildProcess } from 'execa'
import type { ModuleOptions } from '../module'
import type { Audit, CreateAuditInput } from '../types'

export interface HandshakeFunctions {
  status: () => Promise<void>
  connected: () => void
}

export type AuditStore = Audit[]

export interface CreateAuditDefaults {
  name: { default: string, development: string, live: string }
  origin: { default: string, development: string, live: string }
}

export interface WorkerFunctions {
  getAuditResults: (id: number) => Promise<{ meta: any, lintResults: string }>
  generateCreateDefaults: () => Promise<CreateAuditDefaults>
  createAudit: (input: CreateAuditInput) => Promise<Audit>
  queryAllAudits: () => Promise<AuditStore>
  retryTask: (id: number, task: keyof Audit['tasks']) => Promise<void>
  terminateTask: (id: number, task: keyof Audit['tasks']) => Promise<void>
}

export interface ServerFunctions extends HandshakeFunctions, WorkerFunctions {}

export interface ClientFunctions {
  refresh: (event: keyof ServerFunctions) => void
  queueWorking: (payload: { queueLength: number }) => void
  updated: () => void
  filter: (payload: { link: string }) => void
  results: (payload: { link: string, result: any }) => void
}

export interface NuxtAnalyzeDevtoolsServerContext extends NuxtDevtoolsServerContext {
  nuxtAnalyzeOptions: ModuleOptions
  refreshNuxtAnalyzeDevtools: () => void
  state: {
    buildProcess: null | ExecaChildProcess
    buildTaskProcess: null | ExecaChildProcess
    serveTaskProcess: null | ExecaChildProcess
    crawlTaskProcess: null | ExecaChildProcess
    analyzeTaskProcess: null | ExecaChildProcess
  }
  storageContainer: Promise<{ storage: Storage, storageFilepath: string }>
  // audit
  updateAudit: (data: Partial<Audit>) => Promise<void>
  // store
  queryAllAudits: () => Promise<AuditStore>
  createAudit: (audit: Partial<Audit>) => Promise<Audit>
}
