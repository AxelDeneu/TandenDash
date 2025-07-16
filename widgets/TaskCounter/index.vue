<template>
  <div 
    class="h-full w-full p-4 rounded-lg"
    :class="{ 'border-2': showBorder }"
    :style="{ borderColor: color }"
  >
    <h2 class="text-xl font-bold mb-4" :style="{ color }">
      {{ title }}
    </h2>
    
    <div class="text-center">
      <div class="text-3xl font-bold mb-2" :style="{ color }">
        {{ completedTasks }} / {{ taskCount }}
      </div>
      <div class="text-sm text-gray-600 mb-4">
        Tasks Completed
      </div>
      
      <div v-if="showProgress" class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300"
          :style="{ 
            backgroundColor: color, 
            width: `${(completedTasks / taskCount) * 100}%` 
          }"
        ></div>
      </div>
      
      <div v-if="showProgress" class="text-xs text-gray-500 mt-2">
        {{ Math.round((completedTasks / taskCount) * 100) }}% Complete
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WidgetConfig } from './definition'

const props = defineProps<WidgetConfig & { id?: number }>()
</script>