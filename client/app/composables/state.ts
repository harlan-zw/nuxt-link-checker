import type { AsyncDataOptions } from '#app'
import type { Audit } from 'nuxt-link-checker/src/types'
import type { Ref } from 'vue'
import { useRpcConnection } from '~/composables/rpc'

// copied from nuxt devtools
export function useAsyncState<T>(key: string, fn: () => Promise<T>, options?: AsyncDataOptions<T>) {
  const nuxt = useNuxtApp()

  const unique = nuxt.payload.unique = nuxt.payload.unique || {} as any
  if (!unique[key])
    unique[key] = useAsyncData(key, fn, options)

  return unique[key].data as Ref<T | null>
}

export function useAuditStore() {
  const rpc = useRpcConnection()
  return useAsyncState('queryAllAudits', () => {
    return rpc.queryAllAudits()
  })
}

export function useActiveAudit(): ComputedRef<Audit | null> {
  const data = useAuditStore()
  const route = useRoute()
  return computed(() => {
    return data.value?.find((scan) => {
      return scan.id === Number(route.params.auditId)
    }) || null
  })
}
