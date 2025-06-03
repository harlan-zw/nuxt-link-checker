import { readFile } from 'node:fs/promises'
import { defineEventHandler, getRouterParam, setHeader } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { resolve } from 'pathe'

export default defineEventHandler((e) => {
  const auditId = getRouterParam(e, 'auditId')!
  setHeader(e, 'Content-Type', 'application/vnd.sqlite3')
  const runtimeConfig = useRuntimeConfig(e)
  return readFile(resolve(runtimeConfig.nuxtAnalyze.storageDir, auditId, 'crawl.sqlite3'))
})
