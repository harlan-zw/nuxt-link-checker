<script setup lang="ts">
import { FixDialog } from '../composables/dialog'
import { devtoolsRpc, linkCheckerRpc } from '../composables/rpc'

const props = defineProps<{
  item: any
}>()

function openFilePath(filepath: string) {
  devtoolsRpc.value.openInEditor(filepath)
}

async function fixDialog() {
  if (!await FixDialog.start(props.item))
    return
  // do fix
  await linkCheckerRpc.value.applyLinkFixes(props.item.sources[0].filepath, props.item.link, props.item.fix)
}
</script>

<template>
  <div v-if="item" mb7 text-sm>
    <template v-if="item.passes">
      <div class="flex gap-2 items-center w-full">
        <div style="flex-basis: 4rem;">
          <span class="text-green-800 text-xs flex items-center font-medium dark:text-green-300">
            <span i-carbon-checkmark-outline mr-1 text-xs />
            Pass
          </span>
        </div>
        <div>
          <div text-sm op60 font-mono>
            {{ item.link }}
          </div>
        </div>
      </div>
    </template>
    <div v-for="(source, i) in item.sources" :key="i" mb4>
      <div flex mb3 items-center gap-3>
        <div text-sm op60 font-mono>
          {{ item.link }}
        </div>
        <NTextExternalLink
          type="button"
          op50
          text-xs
          font-mono
          :link="source.filepath"
          @click.prevent="openFilePath(source.filepath)"
        >
          {{ source.filepath }}
        </NTextExternalLink>
      </div>
      <NCard v-for="(preview, pk) in source.previews" :key="pk" items-center justify-between of-hidden>
        <div flex="~ col gap-1 items-start" px4>
          <CodeHighlight :link="item.link" :code="preview.code" lang="vue-html" class="overflow-auto" :style="{ '--start': preview.lineNumber }" />
        </div>
      </NCard>
    </div>
    <div v-for="(inspection, i) in [...item.error, ...item.warning]" :key="i" flex="~ row gap-2 items-center" mb2>
      <div class="flex gap-2 w-full">
        <div style="flex-basis: 4rem; margin-top: 1px;">
          <template v-if="inspection.scope === 'error'">
            <span class="text-red-800 text-xs flex items-center font-medium dark:text-red-300">
              <span i-carbon-error mr-1 text-xs />
              Error
            </span>
          </template>
          <template v-else>
            <span class="text-yellow-800 flex items-center text-xs font-medium dark:text-yellow-300">
              <span i-carbon-warning mr-1 text-xs />
              Warning
            </span>
          </template>
        </div>
        <div class="flex-grow">
          <div>
            {{ inspection.message }} <span class="text-gray-500">({{ inspection.name }})</span><span v-if="inspection.tip" op60 ml2>{{ inspection.tip }}</span>
          </div>
          <button v-if="inspection.fix" class="hover:shadow-lg transition mt-2 items-center gap-2 inline-flex border-green-500/50 border-1 rounded-lg shadow-sm px-3 py-1" @click="fixDialog">
            <NIcon icon="carbon:magic-wand" />
            <div v-if="inspection.fixDescription">
              {{ inspection.fixDescription }}
            </div>
          </button>
        <!--          <button v-if="inspection.canRetry" @click="fixDialog" class="hover:shadow-lg transition mt-2 items-center gap-2 inline-flex border-green-500/50 border-1 rounded-lg shadow-sm px-3 py-1"> -->
        <!--            <NIcon icon="carbon:retry-failed" /> -->
        <!--            <div> -->
        <!--              Retry -->
        <!--            </div> -->
        <!--          </button> -->
        </div>
      </div>
    </div>
  </div>
</template>
