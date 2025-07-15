<script setup lang="ts">
import { computed } from 'vue'

import type { Page } from '@/types/page'

type Props = {
  rows: number
  cols: number
  snapping: boolean
  editMode: boolean
  page?: Page
}

const props = defineProps<Props>()

// Get margin values safely
const margins = computed(() => ({
  top: props.page?.marginTop || 0,
  right: props.page?.marginRight || 0,
  bottom: props.page?.marginBottom || 0,
  left: props.page?.marginLeft || 0
}))

// Grid container style to constrain grid within margins
const gridContainerStyle = computed(() => ({
  top: `${margins.value.top}px`,
  left: `${margins.value.left}px`,
  right: `${margins.value.right}px`,
  bottom: `${margins.value.bottom}px`
}))

// Computed grid styles with error handling and margin adjustment
const gridRows = computed(() => {
  try {
    const safeRows = Math.max(1, Math.min(100, props.rows || 1))
    return Array.from({ length: safeRows + 1 }, (_, i) => {
      const position = (i / safeRows) * 100
      return {
        top: `${position}%`
      }
    })
  } catch (error) {
    console.error('Error calculating grid rows:', error)
    return []
  }
})

const gridCols = computed(() => {
  try {
    const safeCols = Math.max(1, Math.min(100, props.cols || 1))
    return Array.from({ length: safeCols + 1 }, (_, i) => {
      const position = (i / safeCols) * 100
      return {
        left: `${position}%`
      }
    })
  } catch (error) {
    console.error('Error calculating grid cols:', error)
    return []
  }
})

const showGrid = computed(() => {
  return props.snapping && props.editMode && gridRows.value.length > 0 && gridCols.value.length > 0
})

const showMargins = computed(() => {
  return props.editMode && props.page && (
    props.page.marginTop > 0 || 
    props.page.marginRight > 0 || 
    props.page.marginBottom > 0 || 
    props.page.marginLeft > 0
  )
})

const marginStyles = computed(() => {
  if (!props.page) return {}
  
  return {
    top: `${props.page.marginTop}px`,
    right: `${props.page.marginRight}px`,
    bottom: `${props.page.marginBottom}px`,
    left: `${props.page.marginLeft}px`
  }
})
</script>

<template>
  <!-- Margin indicators -->
  <div v-if="showMargins" data-testid="margin-overlay" class="absolute inset-0 pointer-events-none z-5">
    <!-- Top margin -->
    <div 
      v-if="page?.marginTop" 
      class="absolute top-0 left-0 w-full bg-red-500/20 border-b-2 border-red-500/40"
      :style="{ height: `${page.marginTop}px` }"
    />
    <!-- Right margin -->
    <div 
      v-if="page?.marginRight" 
      class="absolute top-0 right-0 h-full bg-red-500/20 border-l-2 border-red-500/40"
      :style="{ width: `${page.marginRight}px` }"
    />
    <!-- Bottom margin -->
    <div 
      v-if="page?.marginBottom" 
      class="absolute bottom-0 left-0 w-full bg-red-500/20 border-t-2 border-red-500/40"
      :style="{ height: `${page.marginBottom}px` }"
    />
    <!-- Left margin -->
    <div 
      v-if="page?.marginLeft" 
      class="absolute top-0 left-0 h-full bg-red-500/20 border-r-2 border-red-500/40"
      :style="{ width: `${page.marginLeft}px` }"
    />
  </div>

  <!-- Grid overlay constrained within margins -->
  <div 
    v-if="showGrid" 
    data-testid="grid-overlay" 
    class="absolute pointer-events-none z-10"
    :style="gridContainerStyle"
  >
    <!-- Grid rows (horizontal lines) -->
    <div 
      v-for="(row, index) in gridRows" 
      :key="`row-${index}`" 
      :style="row" 
      class="absolute left-0 right-0 border-t border-blue-400/30"
    />
    <!-- Grid columns (vertical lines) -->
    <div 
      v-for="(col, index) in gridCols" 
      :key="`col-${index}`" 
      :style="col" 
      class="absolute top-0 bottom-0 border-l border-blue-400/30"
    />
    <!-- Grid corners for better visibility -->
<!--    <div -->
<!--      v-for="(row, rowIndex) in gridRows" -->
<!--      :key="`corners-row-${rowIndex}`"-->
<!--    >-->
<!--      <div-->
<!--        v-for="(col, colIndex) in gridCols"-->
<!--        :key="`corner-${rowIndex}-${colIndex}`"-->
<!--        :style="{ -->
<!--          top: row.top, -->
<!--          left: col.left,-->
<!--          transform: 'translate(-2px, -2px)'-->
<!--        }"-->
<!--        class="absolute w-1 h-1 bg-blue-400/50 rounded-full"-->
<!--      />-->
<!--    </div>-->
  </div>
</template> 