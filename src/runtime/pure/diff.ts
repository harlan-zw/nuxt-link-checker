import { readFile } from 'node:fs/promises'
import { diffLines } from 'diff'
import MagicString from 'magic-string'

// 100 max size
export const lruFsCache = new Map<string, string>()

export function generateLinkSources(s: string, link: string) {
  // escape link for regex
  const regEscapedLink = link.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const VueLinkRegExp = new RegExp(`(['"])${regEscapedLink}(['"])`)
  // need to match links like [About Us](/about-us)
  const MdLinkRegExp = new RegExp(`\\[.*\\]\\((${regEscapedLink})\\)`)
  // split the file into lines
  const lines = s.split('\n')
  const sources = []
  // scan all lines for the link
  for (const [i, line] of lines.entries()) {
    const lineNumber = i + 1
    const preLineLength = lines.slice(0, lineNumber - 1).join('\n').length + 1
    // need to get the line index using the LinkRegExp
    let index = line.search(VueLinkRegExp)
    if (index !== -1) {
      // get the line number
      // get the column number
      const columnNumber = index - 1
      // need to correct offsets for quotes
      const start = preLineLength + index + 1
      const end = start + link.length
      sources.push({ start, end, lineNumber, columnNumber })
    }
    else {
      index = line.search(MdLinkRegExp)
      if (index !== -1) {
        const substr = line.slice(index)
        // we need to start from the first ( from [About Us](/about-us/)
        const start = preLineLength + index + substr.indexOf('(', index) + 1
        const end = start + link.length
        // sanity check, should match
        if (s.substring(start, end) === link) {
          sources.push({ start, end, lineNumber: i + 1, columnNumber: start })
        }
      }
    }
  }
  return sources
}

// amount of lines before and after the source line to show
const LINE_PREVIEW_OFFSET = 2

export async function generateFileLinkPreviews(filepath: string, link: string) {
  // use lruFsCache
  const contents = lruFsCache.has(filepath) ? lruFsCache.get(filepath)! : await readFile(filepath, 'utf8')
  const previews = generateLinkSourcePreviews(contents, link)
  let lang = filepath.split('.').pop()
  if (!lang)
    lang = 'vue'
  lruFsCache.set(filepath, contents)
  if (lruFsCache.size > 100)
    lruFsCache.delete(lruFsCache.keys().next().value)
  return { previews, lang, filepath }
}

export async function generateFileLinkDiff(filepath: string, original: string, replacement: string) {
  const contents = lruFsCache.has(filepath) ? lruFsCache.get(filepath)! : await readFile(filepath, 'utf8')
  lruFsCache.set(filepath, contents)
  if (lruFsCache.size > 100)
    lruFsCache.delete(lruFsCache.keys().next().value)
  return {
    ...generateLinkDiff(contents, original, replacement),
    filepath,
  }
}

export function generateLinkSourcePreviews(s: string, link: string) {
  const sources = generateLinkSources(s, link)
  const lines = s.split('\n')
  return sources.map(({ lineNumber, columnNumber }) => {
    // get the snippet, use LINE_PREVIEW_OFFSET
    const code = lines.slice(lineNumber - LINE_PREVIEW_OFFSET - 1, lineNumber + LINE_PREVIEW_OFFSET).join('\n')
    return { code, lineNumber, columnNumber }
  })
}

export function generateLinkDiff(s: string, originalLink: string, newLink: string) {
  const ms = new MagicString(s)
  const sources = generateLinkSources(s, originalLink)
  sources.forEach(({ start, end }) => {
    ms.remove(start, end)
    ms.prependRight(start, newLink)
  })

  return { diff: calculateDiff(s, ms.toString()), code: ms.toString() }
}

function calculateDiff(from: string, to: string) {
  const diffs = diffLines(from.trim(), to.trim())

  const added: number[] = []
  const removed: number[] = []
  const result = []

  for (const diff of diffs) {
    const lines = diff.value.trimEnd().split('\n')
    for (const line of lines) {
      if (diff.added) {
        added.push(result.length)
        result.push(line)
      }
      else if (diff.removed) {
        removed.push(result.length)
        result.push(line)
      }
      else {
        result.push(line)
      }
    }
  }

  return {
    added,
    removed,
    result: result.join('\n'),
  }
}
