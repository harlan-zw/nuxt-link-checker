import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { BirpcReturn } from 'birpc'
import { ref, unref } from 'vue'
import type { NuxtDevtoolsClient } from '@nuxt/devtools-kit/dist/types'
import { getQuery } from 'ufo'
import type { $Fetch } from 'nitropack'
import type { ClientFunctions, ServerFunctions } from '../../src/rpc-types'
import type { NuxtLinkCheckerClient } from '../../src/runtime/types'
import { linkDb, linkFilter, queueLength, refreshSources, visibleLinks } from './state'

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export const appFetch = ref<$Fetch>()

export const devtools = ref<NuxtDevtoolsClient>()
export const linkCheckerRpc = ref<BirpcReturn<ServerFunctions>>()
export const devtoolsRpc = ref<NuxtDevtoolsClient['rpc']>()

onDevtoolsClientConnected(async (client) => {
  appFetch.value = client.host.app.$fetch

  const nuxt = client.host.nuxt
  const linkCheckerClient = nuxt.vueApp._instance?.appContext.provides.linkChecker as NuxtLinkCheckerClient
  linkDb.value = linkCheckerClient.linkDb.value
  visibleLinks.value = [...linkCheckerClient.visibleLinks]
  devtoolsRpc.value = client.devtools.rpc
  devtools.value = client.devtools
  linkFilter.value = getQuery(client.host.getIframe()?.src || '').link as string

  linkCheckerRpc.value = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
    queueWorking(payload) {
      queueLength.value = payload.queueLength
      linkDb.value = unref(linkCheckerClient.linkDb)
      visibleLinks.value = [...linkCheckerClient.visibleLinks]
    },
    updated() {
      linkDb.value = unref(linkCheckerClient.linkDb)
      visibleLinks.value = [...linkCheckerClient.visibleLinks]
    },
    filter(payload) {
      linkFilter.value = payload.link
    },
  })

  linkCheckerRpc.value!.connected()
  refreshSources()
})
