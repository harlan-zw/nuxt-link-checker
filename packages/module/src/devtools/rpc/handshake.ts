import type { HandshakeFunctions, NuxtAnalyzeDevtoolsServerContext } from '../types'
import { stringify } from 'devalue'

export function setupHandshakeRpc({ queryAllAudits }: NuxtAnalyzeDevtoolsServerContext) {
  // const viteServerWs = useViteWebSocket()
  return {
    async connected() {
      // const ws = await viteServerWs
      // ws.send('nuxt-link-checker:connected')
      // console.log('[nuxt-link-checker] connected')
      // await eslintContainer.init()
      const res = await queryAllAudits()
      // if (typeof res?.currentScanId !== 'undefined') {
      //   res.results = await (await storageContainer).storage.getItem(`scan-${res.currentScanId}.json`) || []
      // }
      // const currentScan = res?.scans.find(scan => scan.id === res.currentScanId)
      // // maybe got stuck
      // if (currentScan && !currentScan.queue.size && !currentScan.ready) {
      //   await postProcessReport({
      //     results: res.results,
      //     storageContainer,
      //     currentScan: res?.scans.find(scan => scan.id === res.currentScanId),
      //     eslintContainer,
      //   })
      //   // save both scan meta and results
      //   await (await storageContainer).storage.setItem('scan-meta.json', stringify(res))
      //   await (await storageContainer).storage.setItem(`scan-${res.currentScanId}.json`, res.results)
      // }
      return stringify(res)
    },
  } satisfies HandshakeFunctions
}
