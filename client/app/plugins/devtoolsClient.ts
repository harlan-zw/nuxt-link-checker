import type { ClientFunctions, ServerFunctions } from 'nuxt-link-checker/src/devtools/types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export default defineNuxtPlugin({
  setup(nuxt) {
    onDevtoolsClientConnected(async (client) => {
      const rpc = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
        async refresh(type) {
          // refresh useAsyncData
          nuxt.hooks.callHookParallel('app:data:refresh', [type])
        },
      })
      console.log('RPC connected successfully.', rpc)
      nuxt._rpcContext = rpc
      // await rpc.connected()
      await nuxt.hooks.callHook('nuxt-analyze:connected', rpc)
    })
  },
})
