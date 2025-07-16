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
  <!-- Margin indicators with subtle styling -->
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="showMargins" data-testid="margin-overlay" class="absolute inset-0 pointer-events-none z-5">
      <!-- Top margin -->
      <div 
        v-if="page?.marginTop" 
        class="absolute top-0 left-0 w-full bg-primary/15 border-b-2 border-dashed border-primary/50 margin-pattern"
        :style="{ height: `${page.marginTop}px` }"
      >
        <span class="absolute bottom-1 right-2 text-xs text-primary/70 font-mono font-medium bg-background/80 px-1 rounded">{{ page.marginTop }}px</span>
      </div>
      <!-- Right margin -->
      <div 
        v-if="page?.marginRight" 
        class="absolute top-0 right-0 h-full bg-primary/15 border-l-2 border-dashed border-primary/50 margin-pattern"
        :style="{ width: `${page.marginRight}px` }"
      >
        <span class="absolute bottom-2 left-1 text-xs text-primary/70 font-mono font-medium bg-background/80 px-1 rounded writing-mode-vertical">{{ page.marginRight }}px</span>
      </div>
      <!-- Bottom margin -->
      <div 
        v-if="page?.marginBottom" 
        class="absolute bottom-0 left-0 w-full bg-primary/15 border-t-2 border-dashed border-primary/50 margin-pattern"
        :style="{ height: `${page.marginBottom}px` }"
      >
        <span class="absolute top-1 right-2 text-xs text-primary/70 font-mono font-medium bg-background/80 px-1 rounded">{{ page.marginBottom }}px</span>
      </div>
      <!-- Left margin -->
      <div 
        v-if="page?.marginLeft" 
        class="absolute top-0 left-0 h-full bg-primary/15 border-r-2 border-dashed border-primary/50 margin-pattern"
        :style="{ width: `${page.marginLeft}px` }"
      >
        <span class="absolute bottom-2 right-1 text-xs text-primary/70 font-mono font-medium bg-background/80 px-1 rounded writing-mode-vertical">{{ page.marginLeft }}px</span>
      </div>
    </div>
  </Transition>

  <!-- Grid overlay with subtle design -->
  <Transition
    enter-active-class="transition-opacity duration-500 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
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
        class="absolute left-0 right-0 border-t border-border/30 grid-line"
      />
      <!-- Grid columns (vertical lines) -->
      <div 
        v-for="(col, index) in gridCols" 
        :key="`col-${index}`" 
        :style="col" 
        class="absolute top-0 bottom-0 border-l border-border/30 grid-line"
      />
      <!-- Grid intersection dots -->
      <div
        v-for="(row, rowIndex) in gridRows"
        :key="`dots-row-${rowIndex}`"
      >
        <div
          v-for="(col, colIndex) in gridCols"
          :key="`dot-${rowIndex}-${colIndex}`"
          :style="{ 
            top: row.top, 
            left: col.left,
            transform: 'translate(-1.5px, -1.5px)'
          }"
          class="absolute w-[3px] h-[3px] bg-border/40 rounded-full grid-dot"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Diagonal stripe pattern for margins */
.margin-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(var(--primary), 0.05) 10px,
    rgba(var(--primary), 0.05) 20px
  );
}

/* Smooth grid line appearance */
.grid-line {
  transition: opacity 0.3s ease;
}

/* Grid dots subtle animation */
.grid-dot {
  transition: all 0.3s ease;
  opacity: 0.6;
}

/* Hover effect for better visibility when needed */
[data-testid="grid-overlay"]:hover .grid-line {
  border-color: rgba(var(--border), 0.4);
}

[data-testid="grid-overlay"]:hover .grid-dot {
  opacity: 1;
  transform: translate(-1.5px, -1.5px) scale(1.2);
}

/* Vertical text for margin labels */
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* Subtle fade at edges */
[data-testid="margin-overlay"] > div::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to var(--gradient-direction, bottom),
    transparent,
    rgba(var(--background), 0.05),
    transparent
  );
  pointer-events: none;
}

/* Set gradient direction for each margin */
[data-testid="margin-overlay"] > div:first-child::after {
  --gradient-direction: bottom;
}

[data-testid="margin-overlay"] > div:nth-child(2)::after {
  --gradient-direction: left;
}

[data-testid="margin-overlay"] > div:nth-child(3)::after {
  --gradient-direction: top;
}

[data-testid="margin-overlay"] > div:nth-child(4)::after {
  --gradient-direction: right;
}
</style> 