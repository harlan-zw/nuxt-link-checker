import type { BirpcReturn } from 'birpc'
import type { ClientFunctions, ServerFunctions } from './rpc-types'
import type { NuxtLinkCheckerClient } from './types'
import { useDevtoolsConnection } from 'nuxtseo-layer-devtools/composables/rpc'
import { getQuery } from 'ufo'
import { ref, unref } from 'vue'
import { linkDb, linkFilter, queueLength, visibleLinks } from './state'

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export const host = ref<any>()
export const linkCheckerRpc = ref<BirpcReturn<ServerFunctions>>()

useDevtoolsConnection({
  onConnected(connectedHost) {
    host.value = connectedHost

    const linkCheckerClient = connectedHost.inject<NuxtLinkCheckerClient>('linkChecker')
    // The injected link-checker client holds the live link data; without it there
    // is nothing to mirror, so finish with the layer's data refresh (already fired).
    if (!linkCheckerClient)
      return

    linkDb.value = linkCheckerClient.linkDb.value
    visibleLinks.value = [...linkCheckerClient.visibleLinks]
    linkFilter.value = getQuery(window.location.href).link as string

    const rpc = connectedHost.rpc<ServerFunctions, ClientFunctions>(RPC_NAMESPACE, {
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
    linkCheckerRpc.value = rpc
    rpc?.connected()
  },
})
