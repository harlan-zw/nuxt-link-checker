import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)
export const VueTemplateSingle = resolve('./fixtures/basic/components/VueTemplateSingle.vue')
export const VueTemplateMulti = resolve('./fixtures/basic/components/VueTemplateMulti.vue')
