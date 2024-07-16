// rpc-types.ts

import type { ModuleOptions } from './module'

export interface ServerFunctions {
  getOptions: () => ModuleOptions
  reset: () => void
  applyLinkFixes: (diff: { filepath: string }[], original: string, replacement: string) => void
  scrollToLink: (link: string) => void
  toggleLiveInspections: (enabled: boolean) => void
  connected: () => void
}

export interface ClientFunctions {
  queueWorking: (payload: { queueLength: number }) => void
  updated: () => void
  filter: (payload: { link: string }) => void
}
