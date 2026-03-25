<script setup lang="ts">
import { FixDialog } from '../composables/dialog'
import { devtoolsRpc } from '../composables/rpc'

function openFilePath(filepath: string) {
  devtoolsRpc.value?.openInEditor(filepath)
}

function handleClose(_a: any, resolve: (value: boolean) => void) {
  resolve(false)
}
</script>

<template>
  <FixDialog v-slot="{ resolve, args }">
    <UModal :open="true" @close="handleClose('close', resolve)">
      <div class="flex flex-col gap-2 w-full p-6">
        <h2 class="text-xl font-semibold text-[var(--color-primary)]">
          Confirm Code Diff
        </h2>

        <div v-for="(source, i) in args[0].diff" :key="i">
          <div class="flex items-center gap-2 mb-1">
            <div class="text-sm gap-2 flex flex-row mb-1 justify-end">
              <span class="text-green-500">+{{ source.diff.added.length }}</span>
              <span class="text-red-500">-{{ source.diff.removed.length }}</span>
            </div>
            <button
              type="button"
              class="opacity-50 text-xs font-mono cursor-pointer hover:opacity-80"
              @click="openFilePath(source.filepath)"
            >
              {{ source.filepath }}
            </button>
          </div>

          <div class="rounded-lg border border-[var(--color-border)] overflow-hidden max-h-50 overflow-auto">
            <div class="flex flex-col gap-1 items-start px-4 py-2">
              <CodeDiff v-bind="source" lang="vue-html" class="overflow-auto" />
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-2 justify-end items-center">
          <DevtoolsAlert variant="info" class="flex-auto text-sm">
            Experimental.
          </DevtoolsAlert>
          <UButton variant="ghost" @click="resolve(false)">
            Cancel
          </UButton>
          <UButton color="primary" @click="resolve(true)">
            Apply Fix
          </UButton>
        </div>
      </div>
    </UModal>
  </FixDialog>
</template>
