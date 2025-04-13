<script setup lang="ts">
import { queryCollection } from '#imports'
import { computed, ref } from 'vue'
import { renderCodeHighlight } from './composables/shiki'

await loadShiki()

const res = ref(null)

const refreshSnippets = ref(0)

const interval = setInterval(() => {
  refreshSnippets.value++
  if (refreshSnippets.value >= 3)
    clearInterval(interval)
}, 2000)

const nodes = computed(() => {
  const validLinks = visibleLinks.value
  let n = [...linkDb.value]
  if (linkFilter.value)
    n = n.filter(node => node.link === linkFilter.value)
  else
    n = n.filter(node => validLinks.includes(node.link))
  // sort by whether or not they have a fix
  return n.sort((a, b) => {
    return a.fix && !b.fix ? 1 : -1
  })
})

// const passingCount = computed(() => {
//   return nodes.value.filter(n => n.passes).length
// })
const errorCount = computed(() => {
  let count = 0
  nodes.value.map(n => n.error.length).forEach((n) => {
    count += n
  })
  return count
})
const warningCount = computed(() => {
  let count = 0
  nodes.value.map(n => n.warning.length).forEach((n) => {
    count += n
  })
  return count
})

const visibleLinkCount = computed(() => {
  return visibleLinks.value.length
})

const passingLinksCount = computed(() => {
  return nodes.value.filter(n => n.passes).length
})

async function retryAll() {
  linkDb.value = []
  queueLength.value = 0
  await linkCheckerRpc.value!.reset()
}
async function toggleLiveInspections() {
  showLiveInspections.value = !showLiveInspections.value
  await linkCheckerRpc.value!.toggleLiveInspections(showLiveInspections.value)
}

const tab = ref('0')
const loading = ref(false)

async function refresh() {
  loading.value = true
  data.value = null
  await retryAll()
  await refreshSources()
  setTimeout(() => {
    loading.value = false
  }, 300)
}

const ruleIdFilter = ref(null)

const ruleTree = computed(() => {
  if (!res.value)
    return []
  const tree = []
  // process metadata.rulesMeta for the category type
  Object.entries(res.value.metadata.rulesMeta).map(([ruleId, rule]) => {
    const [category, ruleName] = ruleId.split('/')
    const count = res.value.results[0].messages.filter(m => m.ruleId === ruleId).length
    const child = {
      label: ruleName,
      // badge is times it appears in res.value.results[0].messages
      badge: {
        // check the severity of the rule
        color: rule.docs.severity === 2 ? 'error' : 'warning',
        value: count,
      },
      onSelect() {
        if (ruleIdFilter.value === ruleId)
          ruleIdFilter.value = null
        else
          ruleIdFilter.value = ruleId
      },
    }
    const existing = tree.find(n => n.label === category)
    if (existing) {
      // increment
      // existing.badge = existing.badge ? existing.badge + 1 : 1
      // check if the rule already exists in children
      const existingChild = existing.children.find(n => n.label === ruleName)
      if (!existingChild) {
        // add the rule to the children
        existing.children.push(child)
      }
      // children need tom be ordered on badge.value
      existing.children = existing.children.sort((a, b) => {
        return (b.badge?.value || 0) - (a.badge?.value || 0)
      })
    }
    else {
      tree.push({
        defaultExpanded: true,
        label: category,
        children: [child],
      })
    }
  })
  return tree
})

function processRuleTitle(title: string) {
  // we need to do a simple transform of the title to replace "`" with a span so we can colour it in
  // for example Missing `lang` in `<html>` tag.
  // becomes Missing <span class="bg-neutral-300">lang</span> in <span class="bg-neutral-300">&lt;html&gt;</span> tag.
  return title
    // escape html
    .replace(/</g, '&lt;')
    .replace(/`([^`]+)`/g, (match, p1) => {
      return `<span class="rounded p-0.5 bg-[var(--ui-color-neutral-950)]/75">${p1}</span>`
    })
}

function getRuleCategory(ruleId: string) {
  // get the category of the rule from the metadata
  const rule = res.value.metadata.rulesMeta[ruleId]
  if (rule)
    return rule.docs.category
  return 'Unknown'
}

const { data: ruleContent } = await useAsyncData(() => {
  return queryCollection('rules').all()
})

function markHtmlMarkdown(s: string) {
  // we nmeed to check all inlkine code blocks i.e `<test></test>`, if it ends with `>` and starts with `<`
  // then we need to append {lang="html"} at the end, otherwise {lang="ts"}
  // example: "Missing `lang` attribute in `<html>` tag." -> "Missing `lang`{lang="ts"} attribute in `<html>`{lang="html"} tag."
  // match on the ` group
  return s.replace(/`([^`]+)`/g, (match, p1) => {
    // check if it ends with >
    if (p1.endsWith('>') && p1.startsWith('<')) {
      return `\`${p1}\`{lang="html"}`
    }
    else {
      return `\`${p1}\`{lang="ts"}`
    }
  })
}

function getCodeAt(s: string, opts: { column: number, endColumn: number, endLine: number, line: number }) {
  const hasAst = !!opts.ast

  const lines = s.split('\n')
  const startLine = opts.line - 1
  const endLine = opts.endLine - 1
  const startColumn = opts.column - 1
  const endColumn = opts.endColumn - 1

  const html = lines.slice(startLine, endLine + 1).map((line, i, arr) => {
    if (arr.length === 1) {
      return line.slice(startColumn, endColumn)
    }
    else if (i === 0) {
      return line.slice(startColumn)
    }
    else if (i === arr.length - 1) {
      return line.slice(0, endColumn + 1)
    }
    else {
      return line
    }
  }).join('\n')

  if (!hasAst) {
    opts.ast = ref(null)
    opts._astPromise = parseMarkdown(['```html', html, '```'].join('\n')).then(res => {
      ast.value = res
    })
  }

  return opts.ast
}

const statsPerCategory = computed(() => {
  if (!res.value)
    return {}
  // for each category such as SEO, Accessibility and Best Practices
  // we need to get the count of errors and warnings
  const stats = {
    SEO: {
      label: 'SEO',
      icon: 'carbon:search',
      errors: 0,
      warnings: 0,
    },
    Accessibility: {
      label: 'Accessibility',
      icon: 'carbon:accessibility',
      errors: 0,
      warnings: 0,
    },
    BestPractices: {
      label: 'Best Practices',
      icon: 'carbon:checkmark-outline',
      errors: 0,
      warnings: 0,
    },
  }
  res.value.results[0].messages.forEach((message) => {
    const category = getRuleCategory(message.ruleId)
    if (category === 'SEO') {
      if (message.severity === 2)
        stats.SEO.errors++
      else
        stats.SEO.warnings++
    }
    else if (category === 'Accessibility') {
      if (message.severity === 2)
        stats.Accessibility.errors++
      else
        stats.Accessibility.warnings++
    }
    else if (category === 'Best Practices') {
      if (message.severity === 2)
        stats.BestPractices.errors++
      else
        stats.BestPractices.warnings++
    }
  })
  return stats
})

const combinedHeadInput = computed(() => {
  if (!res.value)
    return ''
  const head = res.value.results[0].messages.filter(m => m.ruleId === 'html/require-meta-charset')
  if (head.length > 0)
    return head[0].meta
  return ''
})
</script>

<template>
  <UApp>
    <header class="backdrop-blur sticky top-0 z-2 px-4 border-none bg-transparent pt-2 mb-3 px-5 h-auto">
      <UContainer class="max-w-[1200px] lg:bg-gray-600/3 lg:border border-[var(--ui-border)] lg:dark:bg-gray-900/10 mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg">
        <div class="flex justify-between items-center">
          <UButton to="/" variant="link">
          <h1 class="text-xl flex items-center gap-2 text-[var(--ui-text)] font-medium">
            <UIcon name="i-carbon-ibm-engineering-test-mgmt" class="text-blue-300 hidden md:block" />
            Nuxt Audit <UBadge color="neutral" variant="soft" size="sm" class="hidden md:block">
              {{ data?.runtimeConfig?.version || 'v1.0.0' }}
            </UBadge>
          </h1>
          </UButton>
          <div class="flex items-center space-x-3 w-xl">
            <UNavigationMenu  :items="[
                { name: 'overview', label: 'Audits', icon: 'carbon:warning-diamond', to: '/', },
                { name: 'overview', label: 'Rules', to: '/rules', icon: 'i-carbon-list-checked' },
                // { name: 'inspections', label: 'All Issues', icon: 'carbon:warning-diamond' },
                // { name: 'debug', label: 'Debug', icon: 'carbon:debug' },
                { name: 'docs', label: 'Docs', icon: 'carbon:book' },
              ]"
                              />
          </div>
          <div class="flex items-center space-x-3">
            <UTooltip text="Refresh">
              <UButton size="xl" type="button" variant="ghost" color="neutral" @click="refresh">
                <UIcon name="carbon:reset" class="group-hover:text-green-500 size-6 w-6 h-6" />
              </UButton>
            </UTooltip>
            <UButton
              class="mr-5 hover:shadow-lg text-sm transition items-center gap-2 inline-flex border-green-500/50 border-1 rounded-lg shadow-sm px-3 py-1"
              @click="toggleLiveInspections"
            >
              <UIcon :name="`${showLiveInspections ? 'carbon:view-off' : 'carbon:view'}`" />
              <div class="hidden md:block">
                Inspections
              </div>
            </UButton>
          </div>
        </div>
      </UContainer>
    </header>
    <div class="flex-row flex p4 h-full" style="min-height: calc(100vh - 64px);">
      <main class="mx-auto flex flex-col w-full">
        <UContainer class="max-w-[1240px] mx-auto py-4 px-4 lg:px-6">
          <NuxtPage />
        </UContainer>
        <UProgress v-if="loading" />
        <div v-else-if="tab === '0'">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              v-for="(stat, index) in statsPerCategory"
              :key="index"
              :ui="{
                      base: 'transition-all duration-200 hover:shadow-md',
                      body: 'p-4',
                    }"
              class="border-l-[3px]"
              :class="`border-l-${!stat.errors ? 'green' : 'red'}-500`"
            >
              <div class="flex items-center gap-3">
                <div :class="`text-${stat.color}-500 bg-${stat.color}-100 p-2.5 rounded-full`">
                  <UIcon :name="stat.icon" class="text-xl" />
                </div>
                <div>
                  <div class="text-sm text-[var(--ui-text-muted)] font-medium">
                    {{ stat.label }}
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                          <span class="text-2xl font-semibold text-[var(--ui-text-highlighted)]">
                            {{ stat.errors }}
                          </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="tab === '1' && res">
          <UContainer class="max-w-[1240px] mx-auto py-4 px-4 lg:px-6">
            <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12">
              <!-- Sidebar -->
              <aside class="lg:sticky top-14 self-start">
                <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-background-subtle)] px-2.5 py-4 shadow-sm">
                  <UTree :items="ruleTree" class="transition-all">
                    <template #item-trailing="{ item }">
                      <UBadge v-if="item.badge" size="sm" :color="item.badge.color" variant="soft" class="font-mono">
                        {{ item.badge.value }}
                      </UBadge>
                    </template>
                  </UTree>
                </div>
              </aside>

              <!-- Main Content -->
              <div class="space-y-5">
                <!-- Issue Cards -->
                <UPageAccordion
                  :items="res.results[0].messages.filter(m => m.ruleId === ruleIdFilter || !ruleIdFilter)"
                  default-value="1"
                  :ui="{ wrapper: 'border-t border-[var(--ui-border)] pt-3' }"
                >
                  <template #body="{ item: r, open }">
                  <div class="flex justify-between items-start mb-3">
                    <div class="font-mono text-sm text-[var(--ui-text-muted)] bg-[var(--ui-background-muted)] px-2 py-1 rounded">
                      <span class="text-[var(--ui-text-dimmed)]">{{ r.ruleId.split('/')[0] }}</span>/{{ r.ruleId.split('/')[1] }}
                    </div>
                  </div>
                    <div v-if="open" class="prose prose-sm mt-2 text-[var(--ui-text)]">
                      <SourceCodePartial :source="res.results[0].source" :message="r" />
                      <ContentRenderer
                        v-if="ruleContent?.find(c => c.title === r.ruleId.split('/')[1])"
                        :value="ruleContent.find(c => c.title === r.ruleId.split('/')[1])"
                        :components="{ h1: 'ProseHidden' }"
                      />
                    </div>
                  </template>
                  <template #default="{ item: r }">
                  <div class="cursor-pointer">
                  <div class="text-base flex items-center gap-2">
                    <UBadge v-if="r.severity === 2" size="sm" color="error" variant="soft">
                      error
                    </UBadge>
                    <UBadge size="sm" color="info" variant="subtle">
                      {{ getRuleCategory(r.ruleId) }}
                    </UBadge>
                    {{ r.message }}
                  </div>
                  </div>
                  </template>
                </UPageAccordion>
              </div>
            </div>
          </UContainer>
        </div>
        <div v-else-if="tab === '2'">
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <UIcon name="carbon:chart-network" class="mr-1" />
                Internal Links
              </h3>
            </template>
            <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && n.link.startsWith('/'))" :key="index" :item="item" />
          </OSectionBlock>
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <UIcon name="carbon:launch" class="mr-1" />
                External Links
              </h3>
            </template>
            <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && !n.link.startsWith('/'))" :key="index" :item="item" />
          </OSectionBlock>
        </div>
        <div v-else-if="tab === '3'">
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <UIcon name="carbon:settings" class="mr-1" />
                Runtime Config
              </h3>
            </template>
            <div class="px-3 py-2 space-y-5">
              <pre of-auto h-full text-sm style="white-space: break-spaces;" v-html="renderCodeHighlight(JSON.stringify(data?.runtimeConfig || {}, null, 2), 'json').value" />
            </div>
          </OSectionBlock>
        </div>
        <div v-else-if="tab === 'docs'" class="h-full max-h-full overflow-hidden">
          <iframe src="https://nuxtseo.com/link-checker" class="w-full h-full border-none" style="min-height: calc(100vh - 100px);" />
        </div>
        <div class="flex-auto" />
      </main>
    </div>
    <footer>
      <a href="https://nuxtseo.com" target="_blank" class="flex items-end gap-1.5 font-semibold text-xl dark:text-white font-title">
        <NuxtSeoLogo />
      </a>
    </footer>
  </UApp>
</template>

<style>
html {
  --at-apply: font-sans;
  overflow-y: scroll;
  overscroll-behavior: none;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
body::-webkit-scrollbar {
  display: none;
}
body {
  /* trap scroll inside iframe */
  height: calc(100vh + 1px);
}

/* Markdown */
.n-markdown a {
  --at-apply: text-primary hover:underline;
}
.prose a {
  --uno: hover:text-primary;
}
.prose code::before {
  content: ""
}
.prose code::after {
  content: ""
}
pre {
  white-space: break-spaces;
}
</style>
