import { ref, computed, readonly } from 'vue'
import type { ComputedRef } from 'vue'
import type { UIState } from './interfaces'

export function useUIState<TItem extends Record<string, unknown> & { id: string | number } = { id: string | number }>(): UIState & {
  filteredItems: (items: TItem[]) => TItem[]
  sortedItems: (items: TItem[]) => TItem[]
  selectedCount: ComputedRef<number>
  hasSelection: ComputedRef<boolean>
  isSelected: (id: string | number) => boolean
} {
  const selectedItems = ref(new Set<string | number>())
  const searchQuery = ref('')
  const sortBy = ref('')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const filters = ref<Record<string, unknown>>({})

  // Selection methods
  function selectItem(id: string | number): void {
    selectedItems.value.add(id)
  }

  function deselectItem(id: string | number): void {
    selectedItems.value.delete(id)
  }

  function toggleSelection(id: string | number): void {
    if (selectedItems.value.has(id)) {
      deselectItem(id)
    } else {
      selectItem(id)
    }
  }

  function clearSelection(): void {
    selectedItems.value.clear()
  }

  function selectAll(items: TItem[] = []): void {
    clearSelection()
    items.forEach(item => {
      if ('id' in item && item.id !== undefined) {
        selectItem(item.id)
      }
    })
  }

  // Search methods
  function setSearch(query: string): void {
    searchQuery.value = query
  }

  function clearSearch(): void {
    searchQuery.value = ''
  }

  // Sorting methods
  function setSorting(field: string, order: 'asc' | 'desc' = 'asc'): void {
    sortBy.value = field
    sortOrder.value = order
  }

  function clearSorting(): void {
    sortBy.value = ''
    sortOrder.value = 'asc'
  }

  function toggleSortOrder(): void {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }

  // Filter methods
  function setFilter(key: string, value: unknown): void {
    if (value === null || value === undefined || value === '') {
      delete filters.value[key]
    } else {
      filters.value[key] = value
    }
  }

  function clearFilters(): void {
    filters.value = {}
  }

  function removeFilter(key: string): void {
    delete filters.value[key]
  }

  // Computed properties
  const selectedCount = computed(() => selectedItems.value.size)
  const hasSelection = computed(() => selectedCount.value > 0)
  const hasSearch = computed(() => searchQuery.value.length > 0)
  const hasSorting = computed(() => sortBy.value.length > 0)
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)

  function isSelected(id: string | number): boolean {
    return selectedItems.value.has(id)
  }

  // Utility functions for filtering and sorting
  function filteredItems(items: TItem[]): TItem[] {
    let result = items

    // Apply search
    if (hasSearch.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => {
        const searchText = JSON.stringify(item).toLowerCase()
        return searchText.includes(query)
      })
    }

    // Apply filters
    if (hasFilters.value) {
      result = result.filter(item => {
        return Object.entries(filters.value).every(([key, value]) => {
          const itemValue = key in item ? item[key as keyof TItem] : undefined
          if (typeof value === 'string' && typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase())
          }
          return itemValue === value
        })
      })
    }

    return result
  }

  function sortedItems(items: TItem[]): TItem[] {
    if (!hasSorting.value) {
      return items
    }

    return [...items].sort((a, b) => {
      const aValue = sortBy.value in a ? a[sortBy.value as keyof TItem] : undefined
      const bValue = sortBy.value in b ? b[sortBy.value as keyof TItem] : undefined

      let comparison = 0
      if (aValue !== undefined && bValue !== undefined) {
        if (aValue < bValue) comparison = -1
        else if (aValue > bValue) comparison = 1
      }

      return sortOrder.value === 'desc' ? -comparison : comparison
    })
  }

  return {
    selectedItems: readonly(selectedItems),
    searchQuery: readonly(searchQuery),
    sortBy: readonly(sortBy),
    sortOrder: readonly(sortOrder),
    filters: readonly(filters),
    selectedCount,
    hasSelection,
    hasSearch,
    hasSorting,
    hasFilters,
    selectItem,
    deselectItem,
    toggleSelection,
    clearSelection,
    selectAll,
    setSearch,
    clearSearch,
    setSorting,
    clearSorting,
    toggleSortOrder,
    setFilter,
    clearFilters,
    removeFilter,
    isSelected,
    filteredItems,
    sortedItems
  }
}