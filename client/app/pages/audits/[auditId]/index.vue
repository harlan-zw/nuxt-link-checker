<script lang="ts" setup>
import { useRpcConnection } from '~/composables/rpc'
import { useRuleMetadata } from '~/composables/useRuleMetadata'

definePageMeta({
  layout: 'scan',
})

const auditId = useRoute().params.auditId as string
const ctx = useRpcConnection()
const results = await ctx.getAuditResults(auditId)
const res = computed(() => {
  return results.map((re) => {
    const ruleMetadata = useRuleMetadata()
    re.lintResult.messages = re.lintResult.messages.map((m) => {
      const rule = ruleMetadata[m.eslintRuleId.split('/')[1] || '']
      return {
        ...m,
        docs: rule?.meta?.docs || {},
      }
    })
    return re
  })
})

const stats = computed(() => {
  if (!res.value || res.value.length === 0)
    return { errors: 0, warnings: 0, notices: 0 }

  return res.value.reduce((acc: any, item: any) => {
    const hasIssues = item.lintResult?.messages?.length ? 1 : 0
    if (item.error || !item.lintResult) {
      return {
        ...acc,
        errors: acc.errors + 1,
        broken: acc.broken + 1,
      }
    }
    return {
      ...acc,
      errors: acc.errors + item.lintResult.messages.filter((m: any) => m.severity === 2).length,
      warnings: acc.warnings + item.lintResult?.messages.filter((m: any) => m.severity === 1).length,
      notices: acc.notices + item.lintResult?.messages.filter((m: any) => m.severity === 0).length,
      healthy: acc.healthy + (!hasIssues ? 1 : 0),
      hasIssues: acc.hasIssues + (hasIssues ? 1 : 0),
    }
  }, { errors: 0, warnings: 0, notices: 0, healthy: 0, broken: 0, hasIssues: 0, redirects: 0, blocked: 0 })
})

function getTopIssuesBySeverity(severity: number) {
  const groupedByRuleId: any = {}
  if (!res.value) {
    return []
  }

  for (const v of res.value) {
    if (v.error) {
      continue
    }

    const messages = v.lintResult?.messages || []

    for (const m in messages) {
      const message = messages[m]
      if (message.severity !== severity) {
        continue
      }
      const { eslintRuleId } = message

      if (!groupedByRuleId[eslintRuleId]) {
        groupedByRuleId[eslintRuleId] = {
          messages: [],
          pages: new Set(),
        }
      }
      groupedByRuleId[eslintRuleId].messages.push(message)
      groupedByRuleId[eslintRuleId].pages.add(v.path)
    }
  }

  return Object.entries(groupedByRuleId)
    .map(([eslintRuleId, data]: any) => ({
      eslintRuleId,
      docs: data.messages[0]?.docs,
      count: data.messages.length,
      pageCount: data.pages.size,
    }))
    .sort((a, b) => b.pageCount - a.pageCount)
    .slice(0, 5)
}

const topErrors = computed(() => getTopIssuesBySeverity(2))
const topWarnings = computed(() => getTopIssuesBySeverity(1))
const topNotices = computed(() => getTopIssuesBySeverity(0))

const currentTab = ref('errors')

const totalPages = computed(() => {
  return stats.value.healthy + stats.value.hasIssues + stats.value.broken || 0
})

function percentageOf(value: number) {
  if (!totalPages.value)
    return 0
  return Math.round((value / totalPages.value) * 100)
}

// Additional computed stats for overview
const crawlStats = computed(() => {
  const pages = res.value || []
  const totalPages = pages.length
  const crawledPages = pages.filter((p: any) => p.statusCode < 400).length
  const errorPages = pages.filter((p: any) => p.statusCode >= 400).length
  const avgDepth = pages.reduce((sum: number, p: any) => sum + (p.crawlDepth || 0), 0) / totalPages

  return {
    totalPages,
    crawledPages,
    errorPages,
    crawlabilityScore: Math.round((crawledPages / totalPages) * 100),
    avgDepth: Math.round(avgDepth * 10) / 10,
  }
})

const contentStats = computed(() => {
  const pages = res.value?.filter((p: any) => p.statusCode < 400) || []
  const totalWords = pages.reduce((sum: number, p: any) => sum + (p.wordCount || 0), 0)
  const avgWords = Math.round(totalWords / pages.length) || 0
  const pagesWithContent = pages.filter((p: any) => (p.wordCount || 0) > 300).length
  const contentCoverage = Math.round((pagesWithContent / pages.length) * 100) || 0

  return {
    totalWords,
    avgWords,
    pagesWithContent,
    contentCoverage,
  }
})

const performanceStats = computed(() => {
  const pages = res.value?.filter((p: any) => p.statusCode < 400 && p.responseTime) || []
  if (pages.length === 0)
    return { avgLoadTime: 0, fastPages: 0, slowPages: 0 }

  const avgLoadTime = Math.round(pages.reduce((sum: number, p: any) => sum + (p.responseTime || 0), 0) / pages.length)
  const fastPages = pages.filter((p: any) => (p.responseTime || 0) < 300).length
  const slowPages = pages.filter((p: any) => (p.responseTime || 0) > 1000).length

  return {
    avgLoadTime,
    fastPages,
    slowPages,
    performanceScore: Math.round((fastPages / pages.length) * 100),
  }
})

const seoStats = computed(() => {
  const pages = res.value?.filter((p: any) => p.statusCode < 400) || []
  const hasTitle = pages.filter((p: any) => p.title).length
  const hasDescription = pages.filter((p: any) => p.description).length
  const hasH1 = pages.filter((p: any) => p.h1).length

  return {
    titleCoverage: Math.round((hasTitle / pages.length) * 100) || 0,
    descriptionCoverage: Math.round((hasDescription / pages.length) * 100) || 0,
    h1Coverage: Math.round((hasH1 / pages.length) * 100) || 0,
    seoScore: Math.round(((hasTitle + hasDescription + hasH1) / (pages.length * 3)) * 100) || 0,
  }
})

const technicalStats = computed(() => {
  const pages = res.value || []
  const totalPages = pages.length
  if (totalPages === 0)
    return { successRate: 0, redirectRate: 0, errorRate: 0, technicalScore: 0 }

  const successPages = pages.filter((p: any) => p.statusCode >= 200 && p.statusCode < 300).length
  const redirectPages = pages.filter((p: any) => p.statusCode >= 300 && p.statusCode < 400).length
  const errorPages = pages.filter((p: any) => p.statusCode >= 400).length

  const successRate = Math.round((successPages / totalPages) * 100)
  const redirectRate = Math.round((redirectPages / totalPages) * 100)
  const errorRate = Math.round((errorPages / totalPages) * 100)
  const technicalScore = Math.round((successPages / totalPages) * 100)

  return {
    successRate,
    redirectRate,
    errorRate,
    technicalScore,
    successPages,
    redirectPages,
    errorPages,
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Top Metrics Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Page Health -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-blue-400" />
            <span class="font-medium text-sm">Page Health</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold">{{ totalPages }}</span>
              <NuxtLink :to="`/audits/${auditId}/pages`" class="text-blue-400 text-sm hover:underline">
                View all
              </NuxtLink>
            </div>
            <div class="w-full h-2 rounded-full bg-gray-800 flex overflow-hidden">
              <div
                v-if="percentageOf(stats.healthy) > 0"
                class="bg-green-600 h-full"
                :style="`width: ${percentageOf(stats.healthy)}%`"
              />
              <div
                v-if="percentageOf(stats.hasIssues) > 0"
                class="bg-amber-600 h-full"
                :style="`width: ${percentageOf(stats.hasIssues)}%`"
              />
              <div
                v-if="percentageOf(stats.broken) > 0"
                class="bg-red-600 h-full"
                :style="`width: ${percentageOf(stats.broken)}%`"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>{{ stats.healthy }} Healthy</span>
              <span>{{ stats.hasIssues }} Issues</span>
              <span>{{ stats.broken }} Broken</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Issue Summary -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-red-400" />
            <span class="font-medium text-sm">Issue Summary</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold">{{ stats.errors + stats.warnings + stats.notices }}</span>
              <NuxtLink :to="`/audits/${auditId}/issues`" class="text-blue-400 text-sm hover:underline">
                View all
              </NuxtLink>
            </div>
            <div class="w-full h-2 rounded-full bg-gray-800 flex overflow-hidden">
              <div
                v-if="stats.errors > 0"
                class="bg-red-600 h-full"
                :style="`width: ${Math.round((stats.errors / (stats.errors + stats.warnings + stats.notices)) * 100)}%`"
              />
              <div
                v-if="stats.warnings > 0"
                class="bg-amber-600 h-full"
                :style="`width: ${Math.round((stats.warnings / (stats.errors + stats.warnings + stats.notices)) * 100)}%`"
              />
              <div
                v-if="stats.notices > 0"
                class="bg-gray-600 h-full"
                :style="`width: ${Math.round((stats.notices / (stats.errors + stats.warnings + stats.notices)) * 100)}%`"
              />
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>{{ stats.errors }} Errors</span>
              <span>{{ stats.warnings }} Warnings</span>
              <span>{{ stats.notices }} Notices</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Middle Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Crawlability -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-search" class="w-4 h-4 text-green-400" />
            <span class="font-medium text-sm">Crawlability</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold" :class="crawlStats.crawlabilityScore > 90 ? 'text-green-400' : crawlStats.crawlabilityScore > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ crawlStats.crawlabilityScore }}%
              </span>
              <NuxtLink :to="`/audits/${auditId}/reports/crawlability`" class="text-blue-400 text-sm hover:underline">
                Details
              </NuxtLink>
            </div>
            <div class="text-xs text-gray-500">
              {{ crawlStats.crawledPages }}/{{ crawlStats.totalPages }} pages crawled
            </div>
            <div class="text-xs text-gray-500">
              Avg depth: {{ crawlStats.avgDepth }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- Content Quality -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-file-check" class="w-4 h-4 text-purple-400" />
            <span class="font-medium text-sm">Content Quality</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold" :class="contentStats.contentCoverage > 80 ? 'text-green-400' : contentStats.contentCoverage > 60 ? 'text-amber-400' : 'text-red-400'">
                {{ contentStats.contentCoverage }}%
              </span>
              <NuxtLink :to="`/audits/${auditId}/reports/content-analysis`" class="text-blue-400 text-sm hover:underline">
                Details
              </NuxtLink>
            </div>
            <div class="text-xs text-gray-500">
              {{ contentStats.pagesWithContent }} pages with quality content
            </div>
            <div class="text-xs text-gray-500">
              {{ contentStats.avgWords }} words average
            </div>
          </div>
        </div>
      </UCard>

      <!-- Performance -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-zap" class="w-4 h-4 text-yellow-400" />
            <span class="font-medium text-sm">Performance</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold" :class="performanceStats.avgLoadTime < 300 ? 'text-green-400' : performanceStats.avgLoadTime < 1000 ? 'text-amber-400' : 'text-red-400'">
                {{ performanceStats.avgLoadTime }}ms
              </span>
              <NuxtLink :to="`/audits/${auditId}/reports/performance`" class="text-blue-400 text-sm hover:underline">
                Details
              </NuxtLink>
            </div>
            <div class="text-xs text-gray-500">
              {{ performanceStats.fastPages }} fast pages (&lt;300ms)
            </div>
            <div class="text-xs text-gray-500">
              {{ performanceStats.slowPages }} slow pages (&gt;1s)
            </div>
          </div>
        </div>
      </UCard>

      <!-- Technical Health -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-server" class="w-4 h-4 text-orange-400" />
            <span class="font-medium text-sm">Technical Health</span>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl font-bold" :class="technicalStats.technicalScore > 90 ? 'text-green-400' : technicalStats.technicalScore > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ technicalStats.technicalScore }}%
              </span>
              <NuxtLink :to="`/audits/${auditId}/reports/redirects`" class="text-blue-400 text-sm hover:underline">
                Details
              </NuxtLink>
            </div>
            <div class="text-xs text-gray-500">
              {{ technicalStats.successPages }} success pages
            </div>
            <div class="text-xs text-gray-500">
              {{ technicalStats.errorPages }} error pages
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- SEO Health -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-search-check" class="w-4 h-4 text-blue-400" />
            <span class="font-medium text-sm">SEO Health</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-type" class="w-4 h-4 text-blue-400" />
                <span class="text-sm">Title Coverage</span>
              </div>
              <span class="text-sm font-medium" :class="seoStats.titleCoverage > 90 ? 'text-green-400' : seoStats.titleCoverage > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ seoStats.titleCoverage }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-file-text" class="w-4 h-4 text-green-400" />
                <span class="text-sm">Description Coverage</span>
              </div>
              <span class="text-sm font-medium" :class="seoStats.descriptionCoverage > 90 ? 'text-green-400' : seoStats.descriptionCoverage > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ seoStats.descriptionCoverage }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-heading-1" class="w-4 h-4 text-purple-400" />
                <span class="text-sm">H1</span>
              </div>
              <span class="text-sm font-medium" :class="seoStats.h1Coverage > 90 ? 'text-green-400' : seoStats.h1Coverage > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ seoStats.h1Coverage }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-blue-900/20 rounded border border-blue-700/30 mt-3">
              <span class="font-medium text-blue-300 text-sm">Overall SEO Score</span>
              <span class="text-lg font-bold" :class="seoStats.seoScore > 90 ? 'text-green-400' : seoStats.seoScore > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ seoStats.seoScore }}%
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Technical Health -->
      <UCard>
        <div class="px-4 py-3">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-server" class="w-4 h-4 text-green-400" />
            <span class="font-medium text-sm">Technical Health</span>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-green-400" />
                <span class="text-sm">Success Rate</span>
              </div>
              <span class="text-sm font-medium" :class="technicalStats.successRate > 90 ? 'text-green-400' : technicalStats.successRate > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ technicalStats.successRate }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-corner-up-right" class="w-4 h-4 text-amber-400" />
                <span class="text-sm">Redirect Rate</span>
              </div>
              <span class="text-sm font-medium text-amber-400">
                {{ technicalStats.redirectRate }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded border border-gray-700/50">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-red-400" />
                <span class="text-sm">Error Rate</span>
              </div>
              <span class="text-sm font-medium text-red-400">
                {{ technicalStats.errorRate }}%
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-green-900/20 rounded border border-green-700/30 mt-3">
              <span class="font-medium text-green-300 text-sm">Overall Technical Score</span>
              <span class="text-lg font-bold" :class="technicalStats.technicalScore > 90 ? 'text-green-400' : technicalStats.technicalScore > 70 ? 'text-amber-400' : 'text-red-400'">
                {{ technicalStats.technicalScore }}%
              </span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Top Issues -->
    <UCard>
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-red-400" />
            <span class="font-medium text-sm">Top Issues</span>
          </div>
          <div class="flex items-center gap-4">
            <button
              v-for="tab in [
                { value: 'errors', label: 'Errors', count: topErrors.length, color: 'bg-red-500' },
                { value: 'warnings', label: 'Warnings', count: topWarnings.length, color: 'bg-amber-500' },
                { value: 'notices', label: 'Notices', count: topNotices.length, color: 'bg-gray-500' },
              ]"
              :key="tab.value"
              class="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors" :class="[
                currentTab === tab.value ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300',
              ]"
              @click="currentTab = tab.value"
            >
              <div class="w-2 h-2 rounded-full" :class="[tab.color]" />
              {{ tab.label }}
              <span class="ml-1">{{ tab.count }}</span>
            </button>
          </div>
        </div>
        <IssueList
          v-if="currentTab === 'errors'"
          :rules="topErrors"
          :audit-id="auditId"
          severity="error"
          empty-message="No errors found"
        />

        <IssueList
          v-if="currentTab === 'warnings'"
          :rules="topWarnings"
          :audit-id="auditId"
          severity="warning"
          empty-message="No warnings found"
        />

        <IssueList
          v-if="currentTab === 'notices'"
          :rules="topNotices"
          :audit-id="auditId"
          severity="info"
          empty-message="No notices found"
        />
      </div>
    </UCard>
  </div>
</template>
