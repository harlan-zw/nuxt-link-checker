import type { ClientFunctions, ServerFunctions } from '../../../packages/module/src/rpc-types'
import type { NuxtLinkCheckerClient } from '../../../packages/module/src/runtime/types'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { unref } from 'vue'
import type {ConnectedCtx} from "~/composables/rpc";
import {useTimeoutFn} from "@vueuse/core";

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export default defineNuxtPlugin({
  setup(instance) {
    onDevtoolsClientConnected(async (client) => {
      const appFetch = client.host.app.$fetch

      const nuxt = client.host.nuxt
      const linkCheckerClient = nuxt.vueApp._instance?.appContext.provides.linkChecker as NuxtLinkCheckerClient
      // linkDb.value = linkCheckerClient.linkDb.value
      // visibleLinks.value = [...linkCheckerClient.visibleLinks]
      // devtoolsRpc.value = client.devtools.rpc
      // devtools.value = client.devtools
      // linkFilter.value = getQuery(client.host.getIframe()?.src || '').link as string

      // console.log(devtoolsRpc.value.getServerPages())

      // @ts-expect-error untyped
      const rpc = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
        // queueWorking(payload) {
        //   queueLength.value = payload.queueLength
        //   linkDb.value = unref(linkCheckerClient.linkDb)
        //   visibleLinks.value = [...linkCheckerClient.visibleLinks]
        // },
        // updated() {
        //   linkDb.value = unref(linkCheckerClient.linkDb)
        //   visibleLinks.value = [...linkCheckerClient.visibleLinks]
        // },
        // filter(payload) {
        //   linkFilter.value = payload.link
        // },
        results(payload) {
          // res.value = payload
          console.log(payload)
        },
      })

      rpc.connected().then(async (scans) => {
        console.log('RPC connected successfully.', { scans })
        // const workerInstance = {
        //   queue: () => {
        //     const { isPending, start, stop } = useTimeoutFn(() => {
        //       ctx.work()
        //     }, 3000)
        //   },
        //   batch: () => {
        //     const { isPending, start, stop } = useTimeoutFn(() => {
        //       ctx.work()
        //     }, 3000)
        //   }
        // }
        const ctx: ConnectedCtx = {
          $fetch: client.host.app.$fetch,
          scans: ref(scans),
          rpc,
        }
        instance._rpcContext = ctx
        // refreshSources()
        await instance.hooks.callHook('nuxt-analyze:connected', ctx)
        ctx.rpc.work()
      })
    })
  },
})
