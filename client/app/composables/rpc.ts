import type { BirpcReturn } from 'birpc'
import type { ExtractedPayload } from 'nuxt-link-checker/src/build/report'
import type { ClientFunctions, ServerFunctions } from 'nuxt-link-checker/src/devtools/types'

export interface PathResult {
  path: string
  payload: ExtractedPayload
  lintResult: {
    messages: any[]
  }
  error?: {
    message: string
    code: string
  }
}

function onRpcConnected(fn: (ctx: BirpcReturn<ServerFunctions, ClientFunctions>) => void | Promise<void>) {
  const nuxtApp = useNuxtApp()
  if (nuxtApp._rpcContext) {
    return fn(nuxtApp._rpcContext)
  }
  nuxtApp.hooks.hookOnce('nuxt-analyze:connected', (ctx) => {
    fn(ctx)
  })
}

export function useRpcConnection(): BirpcReturn<ServerFunctions, ClientFunctions> {
  const nuxtApp = useNuxtApp()
  return nuxtApp._rpcContext
}
