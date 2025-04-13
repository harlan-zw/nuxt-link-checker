import type { BirpcReturn } from 'birpc'
import type { $Fetch } from 'ofetch'
import type { ClientFunctions, ServerFunctions } from '../../../packages/module/src/rpc-types'

// export const appFetch = ref<$Fetch>()
//
// export const devtools = ref<NuxtDevtoolsClient>()
// export const linkCheckerRpc = ref<BirpcReturn<ServerFunctions>>()
// export const devtoolsRpc = ref<NuxtDevtoolsClient['rpc']>()
//
// export const res = ref()

export interface ConnectedCtx {
  $fetch: $Fetch
  scans: Ref<any[]>
  rpc: BirpcReturn<ServerFunctions, ClientFunctions>
}

export function onRpcConnected(fn: (ctx: ConnectedCtx) => void | Promise<void>) {
  console.log('RPC hook')
  const nuxtApp = useNuxtApp()
  if (nuxtApp._rpcContext) {
    return fn(nuxtApp._rpcContext)
  }
  nuxtApp.hooks.hookOnce('nuxt-analyze:connected', ctx => fn(ctx))
}

export async function useRpcConnection() {
  return new Promise<ConnectedCtx>((resolve) => {
    onRpcConnected((ctx) => {
      resolve(ctx)
    })
  })
}
