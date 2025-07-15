<template>
  <AppErrorBoundary>
    <div class="min-h-screen bg-background" @click="handleTap" @touchend="handleTap">
      <NuxtPage />
    </div>
  </AppErrorBoundary>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { provideComposableContext, initializeComposableContext } from '@/composables'
import AppErrorBoundary from '@/components/common/AppErrorBoundary.vue'

// Provide composable context immediately during setup
provideComposableContext()

const tapCount = ref(0);
let tapTimeout: ReturnType<typeof setTimeout> | null = null;
const mode = ref<'light' | 'dark'>('light');

function isCenter(event: MouseEvent | TouchEvent): boolean {
  let x = 0, y = 0;
  if (event instanceof MouseEvent) {
    x = event.clientX;
    y = event.clientY;
  } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    if (touch) {
      x = touch.clientX;
      y = touch.clientY;
    }
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Center 30% of the screen
  const centerX = w * 0.35;
  const centerY = h * 0.35;
  const centerW = w * 0.3;
  const centerH = h * 0.3;
  return x >= centerX && x <= centerX + centerW && y >= centerY && y <= centerY + centerH;
}

async function setHtmlMode(newMode: 'light' | 'dark') {
  const html = document.documentElement;
  if (newMode === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  mode.value = newMode;
  await $fetch('/api/mode-state', {
    method: 'POST',
    body: { mode: newMode }
  });
}

async function toggleDarkMode() {
  const newMode = mode.value === 'dark' ? 'light' : 'dark';
  await setHtmlMode(newMode);
}

async function handleTap(e: MouseEvent | TouchEvent) {
  if (!isCenter(e)) return;
  tapCount.value++;
  if (tapTimeout) clearTimeout(tapTimeout);
  tapTimeout = setTimeout(() => {
    tapCount.value = 0;
  }, 1000);
  if (tapCount.value === 3) {
    await toggleDarkMode();
    tapCount.value = 0;
  }
}

onMounted(async () => {
  // Initialize the composable system
  await initializeComposableContext()
  
  try {
    const data = await $fetch('/api/mode-state');
    await setHtmlMode(data.mode === 'dark' ? 'dark' : 'light');
  } catch {
    await setHtmlMode('light');
  }
});
</script>
