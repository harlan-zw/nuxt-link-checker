<script lang="ts" setup>
import rules from 'nuxt-analyze-eslint-plugin/rules'
import { computed, h, ref, resolveComponent } from 'vue'

const rulesData = Object.values(rules).map((r) => {
  return {
    name: r.name,
    type: r.meta.type,
    description: r.meta.docs.description,
    recommended: r.meta.docs.recommended,
    category: r.meta.docs.category,
  }
})

const search = ref('')
const selectedCategories = ref([])
const selectedTypes = ref([])

const categories = computed(() => {
  return [...new Set(rulesData.map(rule => rule.category))].filter(Boolean)
})

const types = computed(() => {
  return [...new Set(rulesData.map(rule => rule.type))].filter(Boolean)
})

const filteredRules = computed(() => {
  return rulesData.filter((rule) => {
    const matchesSearch = search.value
      ? rule.name.toLowerCase().includes(search.value.toLowerCase())
      || rule.description.toLowerCase().includes(search.value.toLowerCase())
      : true

    const matchesCategory = selectedCategories.value.length
      ? selectedCategories.value.includes(rule.category)
      : true

    const matchesType = selectedTypes.value.length
      ? selectedTypes.value.includes(rule.type)
      : true

    const matchesRecommended = showRecommendedOnly.value
      ? rule.recommended
      : true

    return matchesSearch && matchesCategory && matchesType && matchesRecommended
  })
})

const UChip = resolveComponent('UChip')
const UBadge = resolveComponent('UBadge')

// Flag to filter by recommended rules
const showRecommendedOnly = ref(false)

const columns = [
  {
    accessorKey: 'name',
    header: 'Rule',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('code', {}, row.getValue('name')),
        row.original.recommended
          ? h(UChip, {
              color: 'success',
              size: 'xs',
              label: 'Recommended',
              class: 'cursor-pointer',
              onClick: () => toggleRecommendedFilter(),
            })
          : null,
      ])
    },
    sortable: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type')
      return h(UBadge, {
        color: getTypeColor(type),
        size: 'sm',
        variant: 'soft',
        class: 'cursor-pointer',
        onClick: () => filterByType(type),
      }, () => type)
    },
    sortable: true,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => h('p', {}, row.getValue('description')),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category')
      return h(UBadge, {
        color: 'info',
        size: 'sm',
        variant: 'soft',
        class: 'cursor-pointer',
        onClick: () => filterByCategory(category),
      }, () => category)
    },
    sortable: true,
  },
]

function getTypeColor(type) {
  switch (type) {
    case 'problem': return 'error'
    case 'suggestion': return 'warning'
    default: return 'neutral'
  }
}

function clearFilters() {
  search.value = ''
  selectedCategories.value = []
  selectedTypes.value = []
  showRecommendedOnly.value = false
}

function filterByType(type) {
  // If already selected, do nothing (prevent toggle behavior)
  if (!selectedTypes.value.includes(type)) {
    // Clear other selections first
    selectedTypes.value = [type]
  }
}

function filterByCategory(category) {
  // If already selected, do nothing (prevent toggle behavior)
  if (!selectedCategories.value.includes(category)) {
    // Clear other selections first
    selectedCategories.value = [category]
  }
}

function toggleRecommendedFilter() {
  showRecommendedOnly.value = !showRecommendedOnly.value
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div class="flex flex-col sm:flex-row gap-4 items-end">
      <UInput v-model="search" icon="i-heroicons-magnifying-glass" placeholder="Search rules..." class="sm:w-64" />

      <USelect
        v-model="selectedCategories"
        :items="categories"
        placeholder="Filter by category"
        multiple
        class="sm:w-64"
      />

      <USelect
        v-model="selectedTypes"
        :items="types"
        placeholder="Filter by type"
        multiple
        class="sm:w-64"
      />

      <UButton
        v-if="search || selectedCategories.length || selectedTypes.length"
        color="gray"
        variant="soft"
        icon="i-heroicons-x-mark"
        @click="clearFilters"
      >
        Clear filters
      </UButton>
    </div>

    <div class="flex justify-between items-center">
      <div v-if="showRecommendedOnly" class="text-sm text-green-600 font-medium flex items-center gap-2">
        <UIcon name="i-heroicons-funnel" />
        Showing recommended rules only
        <UButton
          size="xs"
          color="gray"
          variant="soft"
          icon="i-heroicons-x-mark"
          @click="showRecommendedOnly = false"
        >
          Clear
        </UButton>
      </div>
      <div v-if="filteredRules.length === 0" class="text-gray-500 text-center py-4 w-full">
        No rules found matching your filters
      </div>
    </div>

    <UTable :columns="columns" :data="filteredRules" class="w-full" />
  </div>
</template>
