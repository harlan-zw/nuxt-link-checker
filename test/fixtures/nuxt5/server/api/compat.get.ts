import { defineEventHandler } from 'nuxt/server'
import { inspect } from '#link-checker/server'
import { useRuntimeConfig } from '#nuxtseo/nitro'

export default defineEventHandler(() => ({
  marker: useRuntimeConfig().linkCheckerCompatMarker,
  inspection: inspect({ link: 'javascript:alert(1)' }).error?.[0]?.name,
}))
