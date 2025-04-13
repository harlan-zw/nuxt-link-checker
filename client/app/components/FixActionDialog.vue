<script setup lang="ts">
import { FixDialog } from '../composables/dialog'
import { devtoolsRpc } from '../composables/rpc'

function openFilePath(filepath: string) {
  devtoolsRpc.value?.openInEditor(filepath)
}

function handleClose(a: any, resolve: (value: boolean) => void) {
  resolve(false)
}
</script>

<template>
  <FixDialog v-slot="{ resolve, args }">
    <div my-10>
      <NDialog :model-value="true" style="max-height: 80vh;" @update:model-value="handleClose('a', resolve)" @close="handleClose('b', resolve)">
        <div flex="~ col gap-2" w-200 p4 border="t base">
          <h2 text-xl class="text-primary">
            Confirm Code Diff
          </h2>

          <div v-for="(source, i) in args[0].diff" :key="i">
            <div flex items-center gap-2 mb1>
              <div text-sm gap-2 flex flex-row mb1 justify-end>
                <span class="text-green-500">+{{ source.diff.added.length }}</span><span class="text-red-500">-{{ source.diff.removed.length }}</span>
              </div>
              <button
                type="button"
                op50
                text-xs
                font-mono
                @click="openFilePath(source.filepath)"
              >
                {{ source.filepath }}
              </button>
            </div>

            <UCard :key="i" items-center justify-between of-hidden max-h-50 style="overflow: auto;">
              <div flex="~ col gap-1 items-start" px4 py2>
                <CodeDiff v-bind="source" lang="vue-html" class="overflow-auto" />
              </div>
            </UCard>
          </div>

          <div flex="~ gap-3" mt2 justify-end>
            <UBadge n="sm purple" flex-auto icon="carbon-chemistry">
              Experimental.
            </UBadge>

            <UButton @click="resolve(false)">
              Cancel
            </UButton>
            <UButton @click="resolve(true)">
              Apply Fix
            </UButton>
          </div>
        </div>
      </NDialog>
    </div>
  </FixDialog>
</template>
