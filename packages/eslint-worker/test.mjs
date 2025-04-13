import { resolve } from 'node:path'
import { createESLintWorker } from './dist/controller.mjs'

const eslint = createESLintWorker({
  overrideConfigFile: resolve(import.meta.dirname, 'test/fixtures/eslint.config.ts'),
})

eslint.ensureReady().then(async () => {
  const res = await eslint.lintFiles(resolve(import.meta.dirname, 'test/fixtures/index.html'))
  console.log(res.results[0].messages)
  eslint.terminate()
})
