<script setup lang="ts">
import { ref } from 'vue'

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const ripples = ref<Ripple[]>([])
let nextId = 0

const addRipple = (event: MouseEvent | TouchEvent) => {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  
  let x: number, y: number
  
  if ('touches' in event) {
    x = event.touches[0].clientX - rect.left
    y = event.touches[0].clientY - rect.top
  } else {
    x = event.clientX - rect.left
    y = event.clientY - rect.top
  }
  
  // Calculate ripple size based on element dimensions
  const size = Math.max(rect.width, rect.height) * 2
  
  const ripple: Ripple = {
    id: nextId++,
    x,
    y,
    size
  }
  
  ripples.value.push(ripple)
  
  // Remove ripple after animation
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== ripple.id)
  }, 600)
}

defineExpose({
  addRipple
})
</script>

<template>
  <div class="touch-ripple-container">
    <slot />
    <div class="ripple-wrapper">
      <TransitionGroup name="ripple">
        <span
          v-for="ripple in ripples"
          :key="ripple.id"
          class="ripple"
          :style="{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            marginLeft: `-${ripple.size / 2}px`,
            marginTop: `-${ripple.size / 2}px`
          }"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.touch-ripple-container {
  position: relative;
  overflow: hidden;
}

.ripple-wrapper {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.2;
  transform: scale(0);
  animation: ripple-animation 600ms ease-out;
}

@keyframes ripple-animation {
  to {
    transform: scale(1);
    opacity: 0;
  }
}

.ripple-enter-active {
  transition: none;
}

.ripple-leave-active {
  transition: opacity 200ms ease-out;
}

.ripple-leave-to {
  opacity: 0;
}
</style>