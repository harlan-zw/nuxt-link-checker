<script setup lang="ts">
import { FixDialog } from '../composables/dialog'
import { devtoolsRpc, linkCheckerRpc } from '../composables/rpc'

const { item } = defineProps<{
  item: any
}>()

function openFilePath(filepath: string) {
  devtoolsRpc.value?.openInEditor(filepath)
}

async function fixDialog() {
  if (!await FixDialog.start(item))
    return
  await linkCheckerRpc.value!.applyLinkFixes(item.diff, item.link, item.fix)
}

async function scrollToLink() {
  await linkCheckerRpc.value!.scrollToLink(item.link)
}
</script>

<template>
  <div v-if="item" class="text-sm lg:flex w-full gap-5">
    <div class="flex-shrink-0">
      <UButton variant="ghost" size="xs" icon="carbon:cursor-2" @click="scrollToLink" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex space-x-2">
        <UTooltip :text="item.textContent">
          <div class="opacity-90 truncate" style="max-width: 150px;">
            {{ item.textContent }}
          </div>
        </UTooltip>
        <a :href="item.link" target="_blank" class="font-mono mb-3 truncate text-[var(--color-primary)] hover:underline">
          {{ item.link }}
        </a>
      </div>
      <div>
        <div v-for="(inspection, i) in [...item.error, ...item.warning]" :key="i" class="flex flex-row gap-2 items-center mb-2">
          <div class="flex gap-2 w-full">
            <div style="min-width: 150px; margin-top: 1px;">
              <template v-if="inspection.scope === 'error'">
                <div class="text-red-800 text-xs flex items-center font-medium dark:text-red-300">
                  <UIcon name="carbon:error" class="mr-1 text-xs" />
                  Error
                </div>
              </template>
              <template v-else>
                <div class="text-yellow-800 flex items-center text-xs font-medium dark:text-yellow-300">
                  <UIcon name="carbon:warning" class="mr-1 text-xs" />
                  Warning
                </div>
              </template>
              <span class="text-[var(--color-text-muted)]">{{ inspection.name }}</span>
            </div>
            <div class="flex-grow">
              <div>{{ inspection.message }}</div>
              <div v-if="inspection.tip">
                <span class="opacity-60">{{ inspection.tip }}</span>
              </div>
              <UButton
                v-if="inspection.fix"
                variant="outline"
                color="green"
                size="xs"
                icon="carbon:magic-wand"
                :label="inspection.fixDescription"
                class="mt-2"
                @click="fixDialog"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <template v-if="item.passes">
      <div class="flex gap-2 items-center">
        <div style="flex-basis: 4rem;">
          <span class="text-green-800 text-xs flex items-center font-medium dark:text-green-300">
            <UIcon name="carbon:checkmark-outline" class="mr-1 text-xs" />
            Pass
          </span>
        </div>
      </div>
    </template>
    <div v-else class="flex flex-col w-full">
      <div v-if="!item.sources?.length" class="text-[var(--color-text-muted)]">
        No source code found.
      </div>
      <div v-for="(source, i) in item.sources" :key="i" class="mb-4">
        <div class="flex mb-1 items-center">
          <button
            type="button"
            class="opacity-50 text-xs font-mono cursor-pointer hover:opacity-80"
            @click="openFilePath(source.filepath)"
          >
            {{ source.filepath }}
          </button>
        </div>
        <div v-for="(preview, pk) in source.previews" :key="pk" class="rounded-lg border border-[var(--color-border)] overflow-hidden">
          <CodeHighlight :link="item.link" :code="preview.code" lang="vue-html" class="overflow-auto" :style="{ '--start': Math.max(preview.lineNumber - 2, 1) }" />
        </div>
      </div>
    </div>
  </div>
</template>
