# Composables Migration Guide

This guide helps migrate from the old composable architecture to the new SOLID-compliant system.

## Architecture Changes

### Before (Phase 3)
```typescript
// Large, mixed-responsibility composable
const useWidgets = (getPageById) => {
  // Mixed concerns: API calls, UI state, loading, error handling
  const widgets = ref([])
  const loading = ref(false)
  const showDialog = ref(false)
  // ... 50+ lines of mixed logic
}
```

### After (Phase 4)
```typescript
// Separated concerns with dependency injection
const operations = useWidgetOperations() // Data operations only
const ui = useWidgetUI()                 // UI state only  
const dialog = useDialogState()          // Dialog state only
const context = useComposableContext()   // Dependency injection
```

## Key Improvements

### 1. Single Responsibility Principle
- `useWidgetOperations`: Data fetching and CRUD operations
- `useWidgetUI`: UI state (selection, drag, resize)
- `useDialogState`: Modal/dialog management
- `useErrorHandler`: Error handling and retry logic
- `useLoadingState`: Loading state management

### 2. Dependency Injection
```typescript
// Before: Direct service imports
import { container } from '@/lib/di/container'

// After: Injected context
const context = useComposableContext()
const service = context.services.createWidgetService()
```

### 3. Event-Driven Communication
```typescript
// Before: Direct coupling
parentComponent.refreshData()

// After: Event-based
context.events.emit('widget:created', widget)
context.events.on('widget:deleted', handleWidgetDeleted)
```

### 4. Proper Error Handling
```typescript
// Before: Basic try/catch
try {
  await apiCall()
} catch (error) {
  console.error(error)
}

// After: Structured error handling
const errorHandler = useErrorHandler(retryOperation)
try {
  await operation()
} catch (error) {
  errorHandler.handleError(error) // Includes retry logic, events, etc.
}
```

## Migration Steps

### 1. Replace Large Composables
```typescript
// Old way
import { useWidgets } from '@/composables/useWidgets'

// New way  
import { useWidgetOperations, useWidgetUI, useDialogState } from '@/composables'

export default {
  setup() {
    const operations = useWidgetOperations()
    const ui = useWidgetUI()
    const addDialog = useDialogState()
    
    return {
      // Expose specific functionality
      widgets: operations.widgets,
      loading: operations.loading,
      createWidget: operations.createWidget,
      selectedWidgets: ui.selectedWidgets,
      openAddDialog: addDialog.open
    }
  }
}
```

### 2. Setup Context Provider
```typescript
// In your main app component or provider
import { provideComposableContext, initializeComposableContext } from '@/composables'

export default {
  async setup() {
    // Provide context to child components
    provideComposableContext()
    
    // Initialize systems
    await initializeComposableContext()
  }
}
```

### 3. Handle Events
```typescript
// Subscribe to composable events
const context = useComposableContext()

context.events.on('widget:created', (widget) => {
  // Handle widget creation
  showNotification(`Widget ${widget.id} created`)
})

context.events.on('error', (error) => {
  // Global error handling
  showErrorNotification(error.message)
})
```

### 4. Update Components
```typescript
// Before: Mixed responsibilities
<template>
  <div>
    <button @click="createWidget" :disabled="loading">
      Add Widget
    </button>
    <div v-for="widget in widgets" :key="widget.id">
      <!-- Widget rendering -->
    </div>
  </div>
</template>

<script setup>
const { widgets, loading, createWidget } = useWidgets()
</script>

// After: Clear separation
<template>
  <div>
    <WidgetToolbar 
      :loading="operations.loading.value"
      @create="handleCreate"
    />
    <WidgetGrid 
      :widgets="operations.widgets.value"
      :selected="ui.selectedWidgets.value"
      @select="ui.selectWidget"
    />
    <WidgetDialog
      v-model:open="dialog.isOpen.value"
      :data="dialog.data.value"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
const operations = useWidgetOperations()
const ui = useWidgetUI()
const dialog = useDialogState()

async function handleCreate(data) {
  const widget = await operations.createWidget(data)
  dialog.close()
}
</script>
```

## Best Practices

### 1. Use Specific Composables
```typescript
// Good: Use specific composables for specific concerns
const { widgets, createWidget } = useWidgetOperations()
const { selectedWidgets, selectWidget } = useWidgetUI()

// Avoid: Using large, general-purpose composables
const everything = useEverything() // Anti-pattern
```

### 2. Handle Errors Properly
```typescript
// Good: Structured error handling
const errorHandler = useErrorHandler(async () => {
  await operations.fetchWidgets()
})

try {
  await operations.createWidget(data)
} catch (error) {
  errorHandler.handleError(error)
}

// Good: Display errors to user
const { error } = useWidgetOperations()
watchEffect(() => {
  if (error.value) {
    showErrorNotification(error.value.message)
  }
})
```

### 3. Use Events for Loose Coupling
```typescript
// Good: Event-based communication
context.events.emit('widget:selected', widgetId)
context.events.on('widget:deleted', refreshList)

// Avoid: Direct method calls between unrelated components
otherComponent.updateSomething() // Anti-pattern
```

### 4. Leverage Loading States
```typescript
// Good: Granular loading states
const loadingState = useLoadingState()

await loadingState.withLoading(async () => {
  await heavyOperation()
}, 'heavy-operation')

// Good: Multiple loading indicators
<Spinner v-if="loadingState.isLoadingKey('fetch')" />
<ProgressBar v-if="loadingState.isLoadingKey('upload')" />
```

## Backward Compatibility

The old composables are still available but deprecated:
- `useWidgets` → `useWidgets.new` (then will replace)
- `useWidgetRegistry` → Use widget system directly

Migration can be done incrementally by component.