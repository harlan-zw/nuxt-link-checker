import type { MaybeRef } from '@vueuse/core'
import type { HighlighterCore } from 'shiki'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { computed, ref, toValue } from 'vue'

export const shiki = ref<HighlighterCore>()

export async function loadShiki() {
  shiki.value = await createHighlighterCore({
    themes: [
      import('@shikijs/themes/github-light'),
      import('@shikijs/themes/github-dark'),
    ],
    langs: [
      import('@shikijs/langs/html'),
      import('@shikijs/langs/vue-html'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/json'),
    ],
    engine: createJavaScriptRegexEngine(),
  })

  return shiki.value
}

export function renderCodeHighlight(code: MaybeRef<string>, lang: 'html') {
  return computed(() => {
    const colorMode = 'light'
    return shiki.value!.codeToHtml(toValue(code) || '', {
      lang,
      theme: colorMode === 'dark' ? 'github-dark' : 'github-light',
    }) || ''
  })
}
