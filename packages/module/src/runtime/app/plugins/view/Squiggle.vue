<script lang="ts" setup>
import { onMounted, ref, watchEffect } from '#imports'

const props = defineProps<{
  el: Element
  color: string
  highlighted: boolean
}>()

defineEmits(['click'])

const box = ref({ x: 0, y: 0, width: 0, height: 0 })
const position = ref({ top: '0px', left: '0px', width: '0px' })

onMounted(() => {
  box.value = props.el.getBoundingClientRect()
  watchEffect(() => {
    const { x, y, width, height } = box.value
    position.value = {
      top: `${document.documentElement.scrollTop + y + height}px`,
      left: `${x}px`,
      width: `${width}px`,
    }
  })
})
</script>

<template>
  <div :style="position" class="root" :class="highlighted ? ['highlighted'] : ''">
    <div class="squiggle" />
    <a role="button" title="Open Link Inspection" v-bind="$attrs" @click="$emit('click')">
      <span class="icon" />
    </a>
  </div>
</template>

<style scoped>
.root {
  z-index: 0;
  position: absolute;
}
@keyframes highlight {
  0% {
    background-color: transparent;
  }
  100% {
    background-color: v-bind(color);
    padding: 3px;
  }
}
.highlighted {
  animation: highlight 0.5s ease-in-out alternate-reverse infinite;
}
.squiggle {
  bottom: 0;
  height: 3px;
  width: 100%;
  position: absolute;
  display: flex;
  pointer-events: none;
  background-image:
    linear-gradient(45deg, transparent 65%, v-bind(color) 80%, transparent 90%),
    linear-gradient(135deg, transparent 5%, v-bind(color) 15%, transparent 25%),
    linear-gradient(135deg, transparent 45%, v-bind(color) 55%, transparent 65%),
    linear-gradient(45deg, transparent 25%, v-bind(color) 35%, transparent 50%);
  background-repeat: repeat-x;
  background-size: 8px 2px;
  background-position:0 100%;
  transition: 0.2s;
  background-color: transparent;
  border: none;
}
a {
  cursor: pointer;
  position: absolute;
  left: -25px;
  top: -19px;
  width: 22px;
  height: 22px;
  background-color: white;
  z-index: 9999;
  padding: 3px;
  border-radius: 50%;
  box-shadow: 1px 1px 20px rgba(0,0,0, 0.1);
  transition: 0.2s;
}
.dark a {
  background-color: #1f1f1f;
}
a:hover {
  background-color: v-bind(color);
}
a:hover .icon {
  color: white;
}
.icon {
  --un-icon: url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 32 32' display='inline-block' vertical-align='middle' width='1.2em' height='1.2em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='m30.976 24.975l-5.001 5.001a3.501 3.501 0 0 1-4.951-4.95l1.414 1.414a1.5 1.5 0 0 0 2.122 2.122l5.002-5.002a1.5 1.5 0 0 0-2.122-2.122l-1.415-1.414a3.501 3.501 0 0 1 4.952 4.95Z'/%3E%3Cpath fill='currentColor' d='m20.025 21.024l-5.001 5.001a3.501 3.501 0 0 0 4.95 4.951l-1.414-1.414a1.5 1.5 0 0 1-2.122-2.122l5.002-5.002a1.5 1.5 0 0 1 2.122 2.122l1.414 1.415a3.501 3.501 0 0 0-4.95-4.952Z'/%3E%3Ccircle cx='7' cy='20' r='2' fill='currentColor'/%3E%3Cpath fill='currentColor' d='M14 20a4 4 0 1 1 4-4a4.012 4.012 0 0 1-4 4m0-6a2 2 0 1 0 2 2a2.006 2.006 0 0 0-2-2'/%3E%3Ccircle cx='21' cy='12' r='2' fill='currentColor'/%3E%3Cpath fill='currentColor' d='M11.308 27.273L3 22.426V9.574l11-6.416l11.496 6.706l1.008-1.728l-12-7a1 1 0 0 0-1.008 0l-12 7A1 1 0 0 0 1 9v14a1 1 0 0 0 .496.864L10.3 29Z'/%3E%3C/svg%3E");
  -webkit-mask: var(--un-icon) no-repeat;
  mask: var(--un-icon) no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  background-color: currentColor;
  color: v-bind(color);
  display: block;
  vertical-align: middle;
  width: 100%;
  height: 100%;
}
</style>
