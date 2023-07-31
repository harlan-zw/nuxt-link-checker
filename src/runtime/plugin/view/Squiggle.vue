<script lang="ts" setup>
import { computed, ref } from '#imports'

const props = defineProps<{
  el: Element
  color: string
}>()

defineEmits(['click'])

const box = ref(props.el.getBoundingClientRect())

const position = computed(() => {
  const { x, y, width, height } = box.value
  return {
    top: `${y}px`,
    left: `${x}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})
</script>

<template>
  <button type="button" :style="position" class="squiggle" v-bind="$attrs" @click="$emit('click')" />
</template>

<style scoped>
.squiggle {
  position: absolute;
  display: flex;
  cursor: pointer;
  background-image:
    linear-gradient(45deg, transparent 65%, v-bind(color) 80%, transparent 90%),
    linear-gradient(135deg, transparent 5%, v-bind(color) 15%, transparent 25%),
    linear-gradient(135deg, transparent 45%, v-bind(color) 55%, transparent 65%),
    linear-gradient(45deg, transparent 25%, v-bind(color) 35%, transparent 50%);
  background-repeat:repeat-x;
  background-size: 8px 2px;
  background-position:0 100%;
  transition: 0.2s;
  background-color: transparent;
  border: none;
}
.squiggle:hover {
  /*  do hover effect with bg image */
  opacity: 0.2;
}
</style>
