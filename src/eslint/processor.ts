import type { Linter } from 'eslint'

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g
const BACKSLASH_RE = /\\/g
const SINGLE_QUOTE_RE = /'/g

interface ExtractedLink {
  url: string
  line: number
  column: number
}

function extractMarkdownLinks(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    MD_LINK_RE.lastIndex = 0
    let match = MD_LINK_RE.exec(line)
    while (match !== null) {
      const linkText = match[1] ?? ''
      const url = match[2] ?? ''
      const urlStart = match.index + linkText.length + 2 // [text](
      links.push({
        url,
        line: i + 1,
        column: urlStart + 1,
      })
      match = MD_LINK_RE.exec(line)
    }
  }

  return links
}

// Stack of line maps to support sequential preprocess/postprocess pairs
const lineMapStack: Map<number, ExtractedLink>[] = []

export const markdownProcessor: Linter.Processor = {
  meta: {
    name: 'link-checker/markdown',
    version: '1.0.0',
  },
  preprocess(text) {
    const links = extractMarkdownLinks(text)
    if (!links.length) {
      lineMapStack.push(new Map())
      return [{ text, filename: '0.md' }]
    }

    const virtualLines: string[] = []
    const lineMap = new Map<number, ExtractedLink>()

    for (let i = 0; i < links.length; i++) {
      const link = links[i]!
      const escaped = link.url.replace(BACKSLASH_RE, '\\\\').replace(SINGLE_QUOTE_RE, '\\\'')
      virtualLines.push(`navigateTo('${escaped}')`)
      lineMap.set(i + 1, link)
    }

    lineMapStack.push(lineMap)

    return [
      { text: virtualLines.join('\n'), filename: '0.js' },
    ]
  },
  postprocess(messages) {
    const lineMap = lineMapStack.pop()
    if (!lineMap || !lineMap.size)
      return messages.flat()

    return messages.flat().map((msg) => {
      const link = lineMap.get(msg.line)
      if (link) {
        return {
          ...msg,
          line: link.line,
          column: link.column,
        }
      }
      return msg
    })
  },
  supportsAutofix: false,
}
