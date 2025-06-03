import { writeFile } from 'node:fs/promises'
import { createResolver } from '@nuxt/kit'
import { eq } from 'drizzle-orm'
import { ESLintWorkerPool } from 'eslint-worker-pool'
import { dirname } from 'pathe'
import { pageRules, pages } from '../../db/audit/schema'
import { database, ensureStorageDir, resolveStoragePath } from '../util'
import { commandDb } from './db'

export async function commandAnalyze() {
  ensureStorageDir()
  const db = await database('crawl')
  // migrate the db
  await commandDb('crawl')

  const titles = (await db.selectDistinct({ title: pages.title }).from(pages)).flatMap(p => p.title).filter(Boolean)
  const descriptions = (await db.selectDistinct({ description: pages.description }).from(pages)).flatMap(p => p.description).filter(Boolean)

  const eslintConfigPath = resolveStoragePath('eslint.runtime.config.mjs')
  console.log({ eslintConfigPath })

  const resolver = createResolver(import.meta.url)
  const from = await resolver.resolvePath('../../../../eslint-plugin/dist/index.mjs')
  await writeFile(eslintConfigPath, `import nuxtAnalyze from "${from}";

export default [
  ...nuxtAnalyze(${JSON.stringify({
    titles,
    descriptions,
  }, null, 2)}),
  {
    ignores: ['!**/.data/']
  },
]`)

  const htmlDir = resolveStoragePath('html')
  using eslint = new ESLintWorkerPool({
    cwd: dirname(htmlDir),
    overrideConfigFile: eslintConfigPath,
    ignorePatterns: ['!**/data/'],
    ignore: false,
  })

  const pagesToAnalyze = await db.select({ requestId: pages.requestId }).from(pages).where(eq(pages.taskAnalyzed, false))
  const pageIds = pagesToAnalyze.map(p => p.requestId)
  const filePaths = pageIds.map(pageId => resolveStoragePath(`html/${pageId}.html`))
  console.log(`Found ${pageIds.length} pages to analyze`, filePaths, resolveStoragePath('html'))

  console.log(`Analyzing ${pageIds.length} pages using worker pool...`)

  const analyzeTasks: (Promise<void>)[] = []
  console.log({ filePaths })
  // Process all files in parallel using the worker pool
  await eslint.lintFiles(filePaths, (error, result, workerInfo) => {
    if (error || !result) {
      console.log({ error, result })
      return
    }
    // eslint-disable-next-line no-async-promise-executor
    analyzeTasks.push(new Promise<void>(async (resolve) => {
      // split on any new line character
      const requestId = result.filePath.replace(/\.html$/, '').split('/').pop()
      // Get the actual pageId from the database using requestId
      const pageRecord = await db.select({ pageId: pages.pageId }).from(pages).where(eq(pages.requestId, requestId)).limit(1)
      if (!pageRecord.length) {
        console.warn(`No page found for requestId: ${requestId}`)
        resolve()
        return
      }
      const pageId = pageRecord[0].pageId
      const sourceSplit = result.source?.split(/\r?\n/) || []
      const messages = result.messages.map((message) => {
        // Lines are 1-indexed in ESLint messages
        const lineIndex = message.line - 1
        const endLineIndex = (message.endLine || message.line) - 1

        // Get the relevant lines of code
        const sourceLines = sourceSplit.slice(lineIndex, endLineIndex)

        // Extract the specific portion using column data
        let highlightedSource = sourceLines.join('\n')
        // For single line issues, extract the specific characters
        const startCol = message.column - 1
        const endCol = message.endColumn || sourceLines[0].length
        highlightedSource = highlightedSource.substring(startCol, endCol)

        return {
          ...message,
          source: highlightedSource,
        }
      })

      // Insert rules into database
      if (messages.length > 0) {
        const ruleInserts = messages.map((message: any) => ({
          pageId,
          eslintRuleId: message.ruleId,
          severity: message.severity,
          message: message.message,
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
          nodeType: message.nodeType,
          messageId: message.messageId,
          fixRange: message.fix?.range ? JSON.stringify(message.fix.range) : null,
          fixText: message.fix?.text || null,
          sourceLines: JSON.stringify(message.sourceContext?.lines || []),
          highlightedSource: message.source,
          startLine: message.sourceContext?.startLine,
          startColumn: message.sourceContext?.startColumn,
        }))

        await db.insert(pageRules).values(ruleInserts)
      }
      // debug the page path and message count
      console.log(`Analyzed page ${pageId} (${result.filePath}) with ${messages.length} issues`)
      await db.update(pages).set({ taskAnalyzed: true }).where(eq(pages.pageId, pageId))
      resolve()
    }))
  })
  await Promise.all(analyzeTasks)

  console.log(`Analyzed ${pageIds.length} pages`)

  await eslint.terminate()
  console.log('ESLint worker terminated gracefully')
}
