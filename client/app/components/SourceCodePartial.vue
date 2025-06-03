<script lang="ts" setup>
import type { ESLint } from 'eslint'

const props = defineProps<{
  source: string
  message: ESLint.LintResult['messages'][number]
}>()

const lines = props.source.split('\n')
const startLine = props.message.line - 1
const endLine = props.message.endLine - 1
const startColumn = props.message.column - 1
const endColumn = props.message.endColumn - 1

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
</script>

<template>
  <!--  <div v-if="loading"> -->
  <!--    <UProgress /> -->
  <!--  </div> -->
  <OCodeBlock v-if="html" :code="html" lang="html" />
  <!--  <MDCRenderer v-else v-bind="ast" /> -->
</template>
