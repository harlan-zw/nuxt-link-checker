// rpc-types.ts

import type { ESLintWorkerController } from 'nuxt-analyze-eslint-worker/controller'
import type { ModuleOptions } from './module'

export interface ESLintContainer {
  controller: ESLintWorkerController
  init: () => Promise<void>
}

export interface ServerFunctions {
  getOptions: () => ModuleOptions
  reset: () => void
  // applyLinkFixes: (diff: { filepath: string }[], original: string, replacement: string) => void
  // scrollToLink: (link: string) => void
  // toggleLiveInspections: (enabled: boolean) => void
  connected: () => void
  getScans: () => Promise<{ id: string, name: string }[]>
  newScan: () => Promise<void>
  work: () => Promise<void>
}

export interface ClientFunctions {
  queueWorking: (payload: { queueLength: number }) => void
  updated: () => void
  filter: (payload: { link: string }) => void
  results: (payload: { link: string, result: any }) => void
}
