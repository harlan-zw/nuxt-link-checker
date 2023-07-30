// rpc-types.ts

export interface ServerFunctions {
  getMyModuleOptions(): any
  reset(): void
  applyLinkFixes(filepath: string, original: string, replacement: string): void
}

export interface ClientFunctions {
  queueWorking(payload: { queueLength: number }): void
  updated(): void
  filter(payload: { link: string }): void
}
