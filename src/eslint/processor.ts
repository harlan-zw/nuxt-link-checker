import type { Linter } from 'eslint'

const MD_LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g

interface ExtractedLink {
  url: string
  line: number
  column: number
}

function extractMarkdownLinks(text: string): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    MD_LINK_RE.lastIndex = 0
    let match = MD_LINK_RE.exec(lines[i])
    while (match !== null) {
      const urlStart = match.index + match[1].length + 2 // [text](
      links.push({
        url: match[2],
        line: i + 1,
        column: urlStart + 1,
      })
      match = MD_LINK_RE.exec(lines[i])
    }
  }

  return links
}

// Stack of line maps to support nested preprocess/postprocess pairs
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
    const lineMap: Map<number, ExtractedLink> = new Map()

    for (let i = 0; i < links.length; i++) {
      const escaped = links[i].url.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')
      virtualLines.push(`navigateTo('${escaped}')`)
      lineMap.set(i + 1, links[i])
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
