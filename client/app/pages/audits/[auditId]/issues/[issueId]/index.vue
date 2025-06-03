<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import { queryCollection } from '#imports'
import { useRpcConnection } from '~/composables/rpc'

definePageMeta({
  layout: 'scan',
})

const { auditId, issueId } = useRoute().params

const { data: allRuleContent } = await useAsyncData(() => {
  return queryCollection('rules').all()
})

const ruleContent = computed(() => {
  const eslintRuleId = issueId!.split('/')[1]
  const rule = allRuleContent.value?.find(rule => rule.title.endsWith(eslintRuleId))
  if (!rule) {
    return null
  }
  console.log(rule.body)
  // drop first index which is a h1 we don't need
  rule.body.value = rule.body.value.slice(1).map((item) => {
    if (item.tag === 'h1') {
      return { ...item, tag: 'h2' }
    }
    return item
  })
  return rule
})

const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')
const NuxtIcon = resolveComponent('UIcon')

const router = useRouter()

interface PathResult {
  path: string
  payload: {
    meta: {
      title: string
      description: string
    }
  }
  lintResult: {
    results: {
      messages: any[]
    }[]
  }
  error?: {
    message: string
    code: string
  }
}

const ctx = useRpcConnection()
const results = await ctx.getAuditResults(auditId)
const res = computed(() => {
  return results.filter(v => v.lintResult?.messages.some(m => m.eslintRuleId === issueId))
})

const pagesTable = computed(() => {
  return res.value?.map((res) => {
    if (res.error) {
      return {
        path: res.path,
        title: '-',
        statusCode: 404,
      }
    }
    return {
      path: res.path,
      title: res.title,
      description: res.description,
      messages: res.lintResult?.messages.filter(m => m.eslintRuleId === issueId).map(issue => issue.message),
      // issueCount: res.lintResult?.messages.filter(m => m.eslintRuleId === issueId).length,
      statusCode: res.statusCode,
    }
  }) || []
})

const columns: TableColumn<PathResult>[] = [
  {
    header: 'Page URL',
    accessorKey: 'path',
    cell: (ctx) => {
      return h('div', { class: 'max-w-[300px] truncate' }, [
        h(NuxtLink, { class: 'text-blue-400 truncate', to: router.resolve({
          name: 'audits-auditId-pages-pageId',
          params: {
            auditId,
            pageId: encodeURI(ctx.getValue()),
          },
        }) }, ctx.getValue()),
        h('div', { class: 'text-xs' }, ctx.row.original.title),
      ])
    },
  },
  {
    header: 'Messages',
    cell: (ctx) => {
      const messages = ctx.row.original.messages
      console.log({ messages })
      if (messages.length === 0) {
        return h('span', { class: 'text-gray-500' }, 'No messages')
      }
      return h('ul', { class: 'list-disc pl-4' }, messages.map((message) => {
        return h('li', { class: 'text-sm' }, [
          h('span', { class: 'font-semibold' }, message),
        ])
      }))
    },
  },
  {
    header: 'Issues',
    accessorKey: 'issues',
    cell: ({ row }) => {
      console.log(row)
      // const code = row.getValue('statusCode')
      // if (code !== 200) {
      //   return h('span', { class: 'capitalize', size: 'sm', variant: 'subtle', color: 'error' }, () =>
      //     [h(NuxtIcon, { icon: 'carbon:error', class: 'text-red-400' }), 'Broken'])
      // }
      const issueCount = Number(row.getValue('issues')) as number
      if (!issueCount) {
        return h('span', () =>
          [h(NuxtIcon, { icon: 'carbon:check', class: 'text-green-400' }), 'Healthy'])
      }
      return h(NuxtLink, { class: 'text-blue-400', to: router.resolve({
        name: 'audits-auditId-pages-pageId',
        params: {
          auditId,
          pageId: encodeURI(row.getValue('path')),
        },
      }) }, () => issueCount === 1
        ? row.original.issue.message
        : `${issueCount} issue${issueCount > 1 ? 's' : ''}`)
    },
  },
]
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="font-semibold mb-3">
      {{ pagesTable.length }} page{{ pagesTable.length ? 's' : '' }} <button class="text-blue-300">
        {{ $route.params.issueId }}
      </button>
    </div>
    <UButton icon="carbon:chevron-left" color="neutral" variant="link" :to="`/audits/${auditId}/issues`">
      All Issues
    </UButton>
  </div>
  <UTable
    :data="pagesTable"
    :columns="columns"
  />
  <ContentRenderer v-if="ruleContent?.body" :value="ruleContent" />
</template>
