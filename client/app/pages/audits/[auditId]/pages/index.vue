<script lang="ts" setup>
import type { PageWithLintResult } from '~/composables/tableColumns'
import { useRpcConnection } from '~/composables/rpc'
import { columnSets, createColumns } from '~/composables/tableColumns'

definePageMeta({
  layout: 'scan',
})

const auditId = useRoute().params.auditId

const rpc = useRpcConnection()
const results = await rpc.getAuditResults(auditId)

// Transform and prepare data
const allPages = computed(() => {
  return results
    .filter((re: any) => !re.error)
    .map((res: any) => ({
      ...res,
      issues: res.lintResult?.messages.length || 0,
    }))
})

// Get available status codes for dynamic filter options
const availableStatusCodes = computed(() => {
  const statusCodes = [...new Set(allPages.value.map((page: any) => page.statusCode))]
  return statusCodes.sort((a: number, b: number) => a - b)
})

// Status filter options
const statusOptions = computed(() => [
  { label: 'All Status', value: 'all' },
  ...availableStatusCodes.value.map((code: number) => ({
    label: `${code} (${allPages.value.filter((p: any) => p.statusCode === code).length})`,
    value: code.toString(),
  })),
])

// Simple reactive state
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const selectedStatus = ref('all')
const showIssuesOnly = ref(false)

// Available columns configuration using the proper table column logic
const availableColumnKeys = ref([...columnSets.allPages])
const enabledColumns = ref(new Set(columnSets.allPages.slice(0, 4))) // Enable first 4 columns by default

// Create the actual table columns using the tableColumns logic
const tableColumns = computed(() => {
  const visibleKeys = availableColumnKeys.value.filter(key => enabledColumns.value.has(key))
  return createColumns(visibleKeys)
})

// For the column management UI
const availableColumns = computed(() =>
  availableColumnKeys.value.map(key => ({
    key,
    label: key === 'issues'
      ? 'Issues'
      : key === 'path'
        ? 'Path'
        : key === 'title'
          ? 'Title'
          : key === 'statusCode'
            ? 'Status'
            : key === 'description'
              ? 'Description'
              : key === 'responseTime'
                ? 'Response Time'
                : key === 'crawlDepth'
                  ? 'Crawl Depth'
                  : key === 'internalLinkRank' ? 'Link Rank' : key,
    enabled: enabledColumns.value.has(key),
  })),
)

const visibleColumns = computed(() => availableColumns.value.filter(col => col.enabled))

// Simple filtering
const filteredPages = computed(() => {
  let filtered = [...allPages.value]

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(page =>
      page.path?.toLowerCase().includes(query)
      || page.title?.toLowerCase().includes(query)
      || page.description?.toLowerCase().includes(query),
    )
  }

  // Status filter
  if (selectedStatus.value !== 'all') {
    const status = Number.parseInt(selectedStatus.value)
    filtered = filtered.filter(page => page.statusCode === status)
  }

  // Issues filter
  if (showIssuesOnly.value) {
    filtered = filtered.filter(page => page.issues > 0)
  }

  return filtered
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredPages.value.length / pageSize.value))
const paginatedPages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPages.value.slice(start, end)
})

// Note: Table columns are defined inline in template for simplicity

// Reset pagination when filters change
watch([searchQuery, selectedStatus, showIssuesOnly], () => {
  currentPage.value = 1
})

function clearFilters() {
  searchQuery.value = ''
  selectedStatus.value = 'all'
  showIssuesOnly.value = false
  currentPage.value = 1
}

function toggleColumn(columnKey: string) {
  if (enabledColumns.value.has(columnKey)) {
    enabledColumns.value.delete(columnKey)
  }
  else {
    enabledColumns.value.add(columnKey)
  }
}

function moveColumn(fromIndex: number, toIndex: number) {
  const columns = [...availableColumnKeys.value]
  const [movedColumn] = columns.splice(fromIndex, 1)
  columns.splice(toIndex, 0, movedColumn)
  availableColumnKeys.value = columns
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Page Explorer
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        {{ filteredPages.length.toLocaleString() }} of {{ allPages.length.toLocaleString() }} pages
      </p>
      <div class="text-xs text-gray-500 mt-1">
        Status codes: {{ availableStatusCodes.join(', ') }} |
        Pages with issues: {{ allPages.filter(p => p.issues > 0).length }}
      </div>
    </div>

    <!-- Filters & Controls -->
    <div class="space-y-4">
      <!-- Search & Quick Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[280px]">
          <UInput
            v-model="searchQuery"
            placeholder="Search pages..."
            icon="i-lucide-search"
            size="md"
          />
        </div>

        <USelect
          v-model="selectedStatus"
          :items="statusOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Filter by status"
          class="w-48"
        />

        <UPopover mode="click">
          <UButton variant="outline" color="neutral">
            <UIcon name="i-lucide-columns" class="w-4 h-4" />
            Columns ({{ enabledColumns.size }})
          </UButton>

          <template #content>
            <div class="p-4 min-w-[280px]">
              <div class="space-y-3">
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Manage Columns
                </div>
                <div class="space-y-1">
                  <div
                    v-for="(column, index) in availableColumns"
                    :key="column.key"
                    class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <!-- Reorder buttons -->
                    <div class="flex flex-col gap-1">
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-chevron-up"
                        :disabled="index === 0"
                        @click="moveColumn(index, index - 1)"
                      />
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-chevron-down"
                        :disabled="index === availableColumnKeys.length - 1"
                        @click="moveColumn(index, index + 1)"
                      />
                    </div>

                    <!-- Column info -->
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium">{{ column.label }}</span>
                        <UCheckbox
                          :model-value="column.enabled"
                          @update:model-value="toggleColumn(column.key)"
                        />
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ column.key }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quick actions -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div class="flex gap-2">
                    <UButton
                      size="xs"
                      variant="outline"
                      @click="enabledColumns = new Set(availableColumnKeys)"
                    >
                      Show All
                    </UButton>
                    <UButton
                      size="xs"
                      variant="outline"
                      @click="enabledColumns.clear()"
                    >
                      Hide All
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </UPopover>

        <UButton
          variant="outline"
          color="neutral"
          @click="clearFilters"
        >
          Clear
        </UButton>
      </div>

      <!-- Secondary Filters -->
      <div class="flex items-center gap-4">
        <UCheckbox v-model="showIssuesOnly">
          <template #label>
            <span class="text-sm text-gray-600 dark:text-gray-400">Show only pages with issues</span>
          </template>
        </UCheckbox>

        <div class="text-xs text-gray-500">
          Status codes: {{ availableStatusCodes.join(', ') }}
        </div>
      </div>
    </div>

    <!-- Results -->
    <UTable
      :key="tableColumns.length"
      :data="paginatedPages as PageWithLintResult[]"
      :columns="tableColumns"
      :empty-state="{
        icon: 'i-lucide-search-x',
        label: 'No pages found',
        description: 'Try adjusting your search or filters to see results.',
      }"
    />

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredPages.length) }}
        of {{ filteredPages.length.toLocaleString() }} results
      </div>
      <UPagination
        v-model="currentPage"
        :page-count="pageSize"
        :total="filteredPages.length"
        size="sm"
      />
    </div>
  </div>
</template>
