import type { NuxtDevtoolsClient, NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import type { BirpcReturn } from 'birpc'
import type { ClientFunctions, ServerFunctions } from '../../src/rpc-types'
import type { NuxtLinkCheckerClient } from '../../src/runtime/types'
import { getQuery } from 'ufo'
import { linkDb, linkFilter, queueLength, visibleLinks } from './state'

const RPC_NAMESPACE = 'nuxt-link-checker-rpc'

export const devtoolsClient = ref<NuxtDevtoolsIframeClient>()
export const linkCheckerRpc = ref<BirpcReturn<ServerFunctions>>()
export const devtoolsRpc = ref<NuxtDevtoolsClient['rpc']>()

useDevtoolsConnection({
  onConnected(client) {
    devtoolsClient.value = client
    devtoolsRpc.value = client.devtools.rpc

    base.value = client.host.nuxt.vueApp.config.globalProperties?.$router?.options?.history?.base || client.host.app.baseURL || '/'
    const $route = client.host.nuxt.vueApp.config.globalProperties?.$route
    if ($route)
      path.value = $route.path || '/'

    const nuxt = client.host.nuxt
    const linkCheckerClient = nuxt.vueApp._instance?.appContext.provides.linkChecker as NuxtLinkCheckerClient
    linkDb.value = linkCheckerClient.linkDb.value
    visibleLinks.value = [...linkCheckerClient.visibleLinks]
    linkFilter.value = getQuery(client.host.getIframe()?.src || '').link as string

    // @ts-expect-error untyped
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
  },
  onRouteChange(route) {
    path.value = route.path
    refreshSources()
  },
})
