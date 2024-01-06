<script setup lang="ts">
import 'floating-vue/dist/style.css'
import { computed, ref } from 'vue'
import FixActionDialog from './components/FixActionDialog.vue'
import { linkCheckerRpc } from './composables/rpc'
import {
  data,
  linkDb,
  linkFilter,
  queueLength,
  refreshSources,
  showLiveInspections,
  visibleLinks,
} from './composables/state'
import { loadShiki, renderCodeHighlight } from './composables/shiki'

await loadShiki()

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

const tab = ref('inspections')
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
</script>

<template>
  <div class="relative n-bg-base flex flex-col">
    <header class="sticky top-0 z-2 px-4 pt-4">
      <div class="flex justify-between items-start" mb2>
        <div class="flex space-x-5">
          <h1 text-xl flex items-center gap-2>
            <NIcon icon="carbon:cloud-satellite-link" class="text-blue-300" />
            Link Checker <NBadge class="text-sm">
              {{ data?.runtimeConfig?.version }}
            </NBadge>
          </h1>
        </div>
        <div class="flex items-center space-x-3 text-xl">
          <fieldset
            class="n-select-tabs flex flex-inline flex-wrap items-center border n-border-base rounded-lg n-bg-base"
          >
            <label
              v-for="(value, idx) of ['inspections', 'links', 'debug', 'docs']"
              :key="idx"
              class="relative n-border-base hover:n-bg-active cursor-pointer"
              :class="[
                idx ? 'border-l n-border-base ml--1px' : '',
                value === tab ? 'n-bg-active' : '',
              ]"
            >
              <div v-if="value === 'inspections'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:warning-diamond opacity-50" />
                      <NBadge class="text-sm">
                        {{ errorCount + warningCount }}
                      </NBadge>
                    </h2>
                  </div>
                  <template #popper>
                    Inspections
                  </template>
                </VTooltip>
              </div>
              <div v-if="value === 'links'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:checkmark-outline opacity-50" />
                      <NBadge class="text-sm">
                        {{ passingLinksCount }}
                      </NBadge>
                    </h2>
                  </div>
                  <template #popper>
                    Valid Links
                  </template>
                </VTooltip>
              </div>
              <div v-else-if="value === 'debug'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:debug opacity-50" />
                    </h2>
                  </div>
                  <template #popper>
                    Debug
                  </template>
                </VTooltip>
              </div>
              <div v-else-if="value === 'docs'" :class="[value === tab ? '' : 'op35']">
                <VTooltip>
                  <div class="px-5 py-2">
                    <h2 text-lg flex items-center>
                      <NIcon icon="carbon:book opacity-50" />
                    </h2>
                  </div>
                  <template #popper>
                    Documentation
                  </template>
                </VTooltip>
              </div>
              <input
                v-model="tab"
                type="radio"
                :value="value"
                :title="value"
                class="absolute cursor-pointer pointer-events-none inset-0 op-0.1"
              >
            </label>
          </fieldset>
          <VTooltip>
            <button text-lg="" type="button" class="n-icon-button n-button n-transition n-disabled:n-disabled" @click="refresh">
              <NIcon icon="carbon:reset" class="group-hover:text-green-500" />
            </button>
            <template #popper>
              Refresh
            </template>
          </VTooltip>
          <button
            class="mr-5 hover:shadow-lg text-sm transition items-center gap-2 inline-flex border-green-500/50 border-1 rounded-lg shadow-sm px-3 py-1"
            @click="toggleLiveInspections"
          >
            <NIcon :icon="`${showLiveInspections ? 'carbon:view-off' : 'carbon:view'}`" />
            <div>
              Inspections
            </div>
          </button>
        </div>
        <div class="items-center space-x-3 hidden lg:flex">
          <div class="opacity-80 text-sm">
            <NLink href="https://github.com/sponsors/harlan-zw" target="_blank">
              <NIcon icon="carbon:favorite" class="mr-[2px]" />
              Sponsor
            </NLink>
          </div>
          <div class="opacity-80 text-sm">
            <NLink href="https://github.com/harlan-zw/nuxt-link-checker" target="_blank">
              <NIcon icon="logos:github-icon" class="mr-[2px]" />
              Submit an issue
            </NLink>
          </div>
          <a href="https://nuxtseo.com" target="_blank" class="flex items-end gap-1.5 font-semibold text-xl dark:text-white font-title">
            <NuxtSeoLogo />
          </a>
        </div>
      </div>
    </header>
    <div class="flex-row flex p4 h-full" style="min-height: calc(100vh - 64px);">
      <main class="mx-auto flex flex-col w-full bg-white dark:bg-black dark:bg-dark-700 bg-light-200 ">
        <NLoading v-if="loading" />
        <div v-else-if="tab === 'inspections'">
          <p v-if="linkFilter" text-sm flex items-center gap-1 mb6>
            <NIcon v-if="queueLength" icon="carbon:progress-bar-round" class="animated animate-spin op50 text-xs" />
            <NIcon icon="carbon:filter" /> Filtering Results. <button type="button" underline @click="linkFilter = false">
              Show All
            </button>
          </p>
          <div v-if="!linkFilter">
            <div flex items-center px3 gap-3 mb3 text-sm>
              <div v-if="queueLength" mr5>
                <NIcon icon="carbon:progress-bar-round" class="animated animate-spin op50 text-xs" />
                {{ Math.round((Math.abs(queueLength - visibleLinkCount) / visibleLinkCount) * 100) }}%
              </div>
              <div text-xs>
                <NIcon icon="carbon:error" h-4 w-4 text-red-500 />
                {{ errorCount }}
                Errors
              </div>
              <div text-xs>
                <NIcon icon="carbon:warning" h-4 w-4 text-red-500 />
                {{ warningCount }}
                Warnings
              </div>
            </div>
            <div class="space-y-3">
              <LinkInspection v-for="(item, index) of [...nodes.filter(n => n.error.length), ...nodes.filter(n => n.warning.length)]" :key="index" :item="item" class=" odd:bg-white dark:odd:bg-[#151515] even:bg-slate-50 dark:even:bg-[#222223] px-2 py-1" />
            </div>
          </div>
          <div v-else>
            <LinkInspection v-for="(item, index) of nodes" :key="index" :item="item" />
          </div>
          <FixActionDialog />
        </div>
        <div v-else-if="tab === 'links'">
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <NIcon icon="carbon:chart-network" class="mr-1" />
                Internal Links
              </h3>
            </template>
            <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && n.link.startsWith('/'))" :key="index" :item="item" />
          </OSectionBlock>
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <NIcon icon="carbon:launch" class="mr-1" />
                External Links
              </h3>
            </template>
            <LinkPassing v-for="(item, index) of nodes.filter(n => n.passes && !n.link.startsWith('/'))" :key="index" :item="item" />
          </OSectionBlock>
        </div>
        <div v-else-if="tab === 'debug'">
          <OSectionBlock>
            <template #text>
              <h3 class="opacity-80 text-base mb-1">
                <NIcon icon="carbon:settings" class="mr-1" />
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
  </div>
</template>

<style>
header {
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  background-color: #fffc;
}

.dark header {
  background-color: #111c;
}

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

html.dark {
  background: #111;
  color-scheme: dark;
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
.prose hr {
  --uno: border-solid border-1 border-b border-base h-1px w-full block my-2 op50;
}

.dark .shiki {
  background: var(--shiki-dark-bg, inherit) !important;
}

.dark .shiki span {
  color: var(--shiki-dark, inherit) !important;
}

/* JSON Editor */
textarea {
  background: #8881
}

:root {
  --jse-theme-color: #fff !important;
  --jse-text-color-inverse: #777 !important;
  --jse-theme-color-highlight: #eee !important;
  --jse-panel-background: #fff !important;
  --jse-background-color: var(--jse-panel-background) !important;
  --jse-error-color: #ee534150 !important;
  --jse-main-border: none !important;
}

.dark, .jse-theme-dark {
  --jse-panel-background: #111 !important;
  --jse-theme-color: #111 !important;
  --jse-text-color-inverse: #fff !important;
  --jse-main-border: none !important;
}

.no-main-menu {
  border: none !important;
}

.jse-main {
  min-height: 1em !important;
}

.jse-contents {
  border-width: 0 !important;
  border-radius: 5px !important;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar:horizontal {
  height: 6px;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

::-webkit-scrollbar-track {
  background: var(--c-border);
  border-radius: 1px;
}

::-webkit-scrollbar-thumb {
  background: #8881;
  transition: background 0.2s ease;
  border-radius: 1px;
}

::-webkit-scrollbar-thumb:hover {
  background: #8885;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
}
</style>
