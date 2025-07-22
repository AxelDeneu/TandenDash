# Plugin Development Guide

TandenDash uses a plugin system for widgets that allows you to create custom widgets with proper lifecycle management and configuration.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Widget Structure](#widget-structure)
- [Widget Plugin Interface](#widget-plugin-interface)
- [Widget Component](#widget-component)
- [API Routes](#api-routes)
- [Configuration & Validation](#configuration--validation)
- [Internationalization (i18n)](#internationalization-i18n)
- [Widget Dependencies](#widget-dependencies)
- [Registration Process](#registration-process)
- [Testing & Debugging](#testing--debugging)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Architecture Overview

The widget plugin system is built around the `WidgetPlugin` interface:

```typescript
interface WidgetPlugin<TConfig extends BaseWidgetConfig = BaseWidgetConfig> {
  id: string
  name: string
  description: string
  version: string
  icon?: string
  category: string
  tags: string[]
  component: Component
  defaultConfig: TConfig
  configSchema: ZodSchema<TConfig>
  dataProvider?: new () => IWidgetDataProvider
  permissions?: string[]
  settings?: IWidgetSettings
  apiRoutes?: WidgetApiRoute[]
}
```

### Key Components

- **id**: Unique identifier for the widget
- **name**: Display name for the widget
- **description**: Brief description of widget functionality
- **component**: Vue component for rendering
- **defaultConfig**: Default configuration values
- **configSchema**: Zod schema for configuration validation
- **settings**: Widget behavior settings (resize, move, delete, configure)

## Getting Started

### 1. Create Widget Directory

```bash
mkdir widgets/MyWidget
cd widgets/MyWidget
```

### 2. Required Files

- `index.vue` - Main widget component
- `definition.ts` - Widget configuration and metadata
- `plugin.ts` - Plugin export

### 3. Basic Structure

```typescript
// definition.ts
import { z } from 'zod'
import { defineWidgetConfig } from '@/lib/widgets/defineWidgetConfig'

export const MyWidgetConfig = defineWidgetConfig({
  // Configuration properties
  title: z.string().default('My Widget'),
  refreshInterval: z.number().default(60)
})

export type MyWidgetConfig = z.infer<typeof MyWidgetConfig>
```

## Widget Structure

### Component (`index.vue`)

```vue
<template>
  <div class="widget-container">
    <h2>{{ props.title }}</h2>
    <p>{{ t('messages.welcome') }}</p>
    <time>{{ currentTime }}</time>
    <!-- Widget content -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MyWidgetConfig } from './definition'
import { MyWidgetPlugin } from './plugin'

const props = defineProps<MyWidgetConfig>()

// Initialize i18n
const { t, locale } = useWidgetI18n(MyWidgetPlugin.id)

// Example: locale-aware time formatting
const currentTime = computed(() => {
  return new Date().toLocaleTimeString(locale.value)
})
</script>
```

### Plugin Definition (`plugin.ts`)

```typescript
import { defineWidgetPlugin } from '@/lib/widgets/definePlugin'
import MyWidgetComponent from './index.vue'
import { MyWidgetConfig } from './definition'

// Export widget ID for use in components
export const MY_WIDGET_ID = 'my-widget'

export const MyWidgetPlugin = defineWidgetPlugin({
  id: MY_WIDGET_ID,
  name: 'My Widget',
  description: 'A custom widget',
  version: '1.0.0',
  category: 'utility',
  tags: ['custom'],
  component: MyWidgetComponent,
  defaultConfig: MyWidgetConfig.parse({}),
  configSchema: MyWidgetConfig,
  settings: {
    canResize: true,
    canMove: true,
    canDelete: true,
    canConfigure: true
  }
})

// Export default for auto-discovery
export default MyWidgetPlugin
```

## Widget Plugin Interface

### Required Properties

- `id`: Unique identifier (lowercase, hyphenated)
- `name`: Display name
- `description`: User-friendly description
- `version`: Semantic version
- `category`: Widget category
- `component`: Vue component
- `defaultConfig`: Default configuration object
- `configSchema`: Zod schema for validation

### Optional Properties

- `icon`: Icon name or component
- `tags`: Array of searchable tags
- `dataProvider`: Server-side data provider class
- `permissions`: Required permissions
- `settings`: Widget behavior settings
- `apiRoutes`: Custom API endpoints

## Widget Component

### Props

All widgets receive their configuration as props:

```typescript
const props = defineProps<YourWidgetConfig>()
```

### Widget Context

You can access widget-specific context:

```typescript
import { useWidgetContext } from '@/composables'

const context = useWidgetContext()
// context.instanceId - Widget instance ID
// context.pageId - Current page ID
```

## API Routes

Define custom API routes for your widget:

```typescript
// plugin.ts
export default defineWidgetPlugin({
  // ... other config
  apiRoutes: [
    {
      method: 'GET',
      path: '/data',
      handler: async (event) => {
        // Handle request
        return { data: 'example' }
      }
    }
  ]
})
```

Access from component:

```typescript
const response = await $fetch(`/api/widgets/${widgetId}/data`)
```

## Configuration & Validation

### Using Zod Schemas

```typescript
import { z } from 'zod'
import { defineWidgetConfig } from '@/lib/widgets/defineWidgetConfig'

export const WeatherWidgetConfig = defineWidgetConfig({
  location: z.string().default('New York'),
  units: z.enum(['metric', 'imperial']).default('metric'),
  showForecast: z.boolean().default(true),
  refreshInterval: z.number().min(60).default(300)
})
```

### Configuration UI

Define custom configuration UI:

```typescript
export default defineWidgetPlugin({
  // ... other config
  configUI: {
    groups: [
      {
        label: 'General',
        options: {
          location: {
            type: 'text',
            label: 'Location',
            placeholder: 'Enter city name'
          },
          units: {
            type: 'select',
            label: 'Units',
            options: [
              { value: 'metric', label: 'Metric' },
              { value: 'imperial', label: 'Imperial' }
            ]
          }
        }
      }
    ]
  }
})
```

## Internationalization (i18n)

Widgets support multiple languages through a dedicated translation system. Each widget can have its own translation files that are automatically loaded based on the user's locale.

### Setting up translations for your widget

1. **Create a `lang` directory** in your widget folder:
```
widgets/YourWidget/
├── lang/
│   ├── en.json
│   ├── fr.json
│   ├── es.json
│   └── de.json
├── index.vue
├── definition.ts
└── plugin.ts
```

2. **Export your widget ID constant** in `plugin.ts`:
```typescript
export const YOUR_WIDGET_ID = 'your-widget'

export const YourWidgetPlugin: WidgetPlugin<YourWidgetConfig> = {
  id: YOUR_WIDGET_ID,
  name: 'Your Widget',
  // ... rest of plugin definition
}
```

3. **Create translation files** for each supported language:

Example `lang/en.json`:
```json
{
  "title": "Your Widget",
  "settings": {
    "label": "Settings",
    "option1": "Option 1"
  },
  "messages": {
    "loading": "Loading...",
    "error": "An error occurred"
  }
}
```

Example `lang/fr.json`:
```json
{
  "title": "Votre Widget",
  "settings": {
    "label": "Paramètres",
    "option1": "Option 1"
  },
  "messages": {
    "loading": "Chargement...",
    "error": "Une erreur s'est produite"
  }
}
```

4. **Use translations in your widget**:

```vue
<script setup lang="ts">
import { YourWidgetPlugin } from './plugin'

// Initialize widget i18n - no import needed, it's auto-imported!
const { t, locale } = useWidgetI18n(YourWidgetPlugin.id)

// Use locale for date/time formatting
const formattedDate = computed(() => {
  return new Date().toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Watch for locale changes
watch(locale, () => {
  // Update any locale-dependent data
  refreshData()
})
</script>

<template>
  <div>
    <h2>{{ t('title') }}</h2>
    <p>{{ t('messages.loading') }}</p>
    <time>{{ formattedDate }}</time>
  </div>
</template>
```

### How it works

1. **Automatic loading**: The `01.widget-i18n.ts` plugin automatically loads all widget translations at startup
2. **Namespacing**: Widget translations are namespaced as `widget_${widgetId}` (lowercase)
3. **Auto-imports**: `useWidgetI18n` is globally available - no import needed
4. **Reactive locale**: The locale ref updates automatically when the user changes language

### Working with dates, times, and units

When displaying dates, times, or measurements, always use the locale:

```typescript
// Dates and times
const time = now.toLocaleTimeString(locale.value, {
  hour: '2-digit',
  minute: '2-digit'
})

// Numbers and units
const temperature = computed(() => {
  const temp = props.unit === 'fahrenheit' ? 
    convertToFahrenheit(value) : value
  return `${temp}° ${props.unit === 'fahrenheit' ? 'F' : 'C'}`
})
```

### API Integration

When calling external APIs, pass the locale and unit preferences:

```typescript
const response = await $fetch('/api/data', {
  query: { 
    locale: locale.value,
    units: props.measurementSystem
  }
})
```

### Best practices

1. **Always provide English translations** as the fallback language
2. **Export widget ID as a constant** to avoid typos and enable refactoring
3. **Use the locale for all user-facing formatting** (dates, times, numbers)
4. **Watch locale changes** to update dynamic content
5. **Test your widget** in different languages

### Available languages

The application currently supports:
- English (en)
- French (fr)
- Spanish (es)
- German (de)

### Dynamic locale changes

Widget translations are automatically reloaded when the user changes the application language. The `locale` ref from `useWidgetI18n` is reactive and will trigger updates in your computed properties and watchers.

## Widget Dependencies

Widgets can have their own npm dependencies that are isolated from the main application.

### Adding dependencies to your widget

1. **Create a `package.json`** in your widget directory:

```json
{
  "name": "tandendash-widget-yourwidget",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "chart.js": "^4.4.0",
    "date-fns": "^2.30.0"
  }
}
```

2. **Install dependencies**:

Dependencies are automatically installed when running the widget dependency installation script:

```bash
npm run install-widget-deps
```

This command will:
- Scan all widget directories for `package.json` files
- Install dependencies in each widget's `node_modules` folder
- Skip widgets without `package.json`

3. **Import dependencies in your widget**:

```typescript
// In your widget component
import { format } from 'date-fns'
import Chart from 'chart.js/auto'
```

### Best practices for widget dependencies

1. **Only include necessary dependencies** to keep widgets lightweight
2. **Use specific versions** to ensure compatibility
3. **Avoid duplicating** dependencies that are already in the main app
4. **Test your widget** after adding new dependencies

### Handling dependency conflicts

- Each widget has its own `node_modules` folder
- Dependencies are isolated between widgets
- Multiple widgets can use different versions of the same package

## Registration Process

### Automatic Registration

Place your widget in the `widgets/` directory and it will be automatically discovered:

```
widgets/
├── MyWidget/
│   ├── index.vue
│   ├── definition.ts
│   └── plugin.ts
```

### Manual Registration

For custom locations, register manually:

```typescript
// plugins/widgets.client.ts
import { useWidgetPlugins } from '@/composables'
import MyWidget from '@/custom-widgets/MyWidget/plugin'

export default defineNuxtPlugin(() => {
  const widgetPlugins = useWidgetPlugins()
  widgetPlugins.registerPlugin(MyWidget)
})
```

## Widget Data Storage

Widgets can store persistent data using the `useWidgetData` composable:

### Basic Usage

```vue
<script setup lang="ts">
import { useWidgetData } from '@/composables'

const props = defineProps<{ id?: number }>()
const widgetData = useWidgetData(props.id)

// Get data
const savedValue = widgetData.get<string>('myKey')

// Set data
await widgetData.set('myKey', 'myValue')

// Remove data
await widgetData.remove('myKey')
</script>
```

### Data Storage API

```typescript
interface UseWidgetData {
  // State
  data: Ref<Map<string, any>>      // All stored data
  loading: Ref<boolean>            // Loading state
  error: Ref<Error | null>         // Error state
  
  // Methods
  get<T>(key: string): T | undefined
  set(key: string, value: any): Promise<void>
  setMultiple(data: Record<string, any>): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  refresh(): Promise<void>
  
  // Computed
  keys: Ref<string[]>              // All stored keys
  size: Ref<number>                // Number of stored items
  isEmpty: Ref<boolean>            // Whether storage is empty
}
```

#### Example: Storing User Tasks

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWidgetData } from '@/composables/data/useWidgetData'

interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

const props = defineProps<{ id?: number }>()
const widgetData = useWidgetData(props.id)

// Load tasks on mount
const tasks = ref<Task[]>(widgetData.get<Task[]>('tasks') || [])

// Add a new task
async function addTask(title: string) {
  const newTask: Task = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date().toISOString()
  }
  
  tasks.value.push(newTask)
  await widgetData.set('tasks', tasks.value)
}

// Toggle task completion
async function toggleTask(id: string) {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    task.completed = !task.completed
    await widgetData.set('tasks', tasks.value)
  }
}

// Delete a task
async function deleteTask(id: string) {
  tasks.value = tasks.value.filter(t => t.id !== id)
  await widgetData.set('tasks', tasks.value)
}
</script>

<template>
  <div class="task-widget">
    <div v-for="task in tasks" :key="task.id" class="task-item">
      <input 
        type="checkbox" 
        :checked="task.completed"
        @change="toggleTask(task.id)"
      />
      <span :class="{ completed: task.completed }">{{ task.title }}</span>
      <button @click="deleteTask(task.id)">Delete</button>
    </div>
    <button @click="addTask('New Task')">Add Task</button>
  </div>
</template>
```

### Advanced Data Storage

#### Reactive Key Binding

```vue
<script setup lang="ts">
import { useWidgetDataKey } from '@/composables'

const props = defineProps<{ id?: number }>()

// Reactive binding to a specific key
const { value: userName, save } = useWidgetDataKey<string>(
  props.id!,
  'userName',
  'Anonymous' // default value
)

// Value is automatically synced
async function updateName(newName: string) {
  await save(newName) // Updates both local and remote
}
</script>
```

#### Batch Operations

```typescript
// Set multiple values at once
await widgetData.setMultiple({
  theme: 'dark',
  language: 'en',
  fontSize: 16
})

// Clear all data
await widgetData.clear()
```

## Testing & Debugging

### Widget Testing

```typescript
// __tests__/MyWidget.test.ts
import { mount } from '@vue/test-utils'
import MyWidget from '../index.vue'
import { MyWidgetConfig } from '../definition'

describe('MyWidget', () => {
  it('renders with default config', () => {
    const config = MyWidgetConfig.parse({})
    const wrapper = mount(MyWidget, {
      props: config
    })
    
    expect(wrapper.find('h2').text()).toBe(config.title)
  })
})
```

### Debug Mode

Enable debug logging:

```typescript
const widgetPlugins = useWidgetPlugins()
console.log('Registered widgets:', widgetPlugins.getAllPlugins())
```

## Best Practices

### 1. Component Organization

- Keep components small and focused
- Use composables for reusable logic
- Implement proper error handling

### 2. Performance

- Implement proper cleanup in `onUnmounted`
- Use `computed` and `watch` efficiently
- Debounce expensive operations

### 3. Configuration

- Provide sensible defaults
- Validate all user inputs
- Document configuration options

### 4. Styling

- Use Tailwind CSS classes
- Respect theme variables
- Ensure responsive design

### 5. Error Handling

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <div v-if="error" class="error">
    {{ error.message }}
  </div>
  <div v-else>
    <!-- Widget content -->
  </div>
</template>
```

## Examples

### Simple Clock Widget

```vue
<!-- index.vue -->
<template>
  <div class="text-center p-4">
    <div class="text-4xl font-bold">{{ time }}</div>
    <div class="text-sm text-gray-500">{{ date }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { ClockWidgetConfig } from './definition'
import { ClockWidgetPlugin } from './plugin'

const props = defineProps<ClockWidgetConfig>()

// Initialize i18n
const { locale } = useWidgetI18n(ClockWidgetPlugin.id)

const time = ref('')
const date = ref('')
let timer: number

function updateTime() {
  const now = new Date()
  time.value = now.toLocaleTimeString(locale.value)
  date.value = now.toLocaleDateString(locale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Update when locale changes
watch(locale, updateTime)

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>
```

### Weather Widget with API

```typescript
// plugin.ts
export default defineWidgetPlugin({
  // ... config
  apiRoutes: [
    {
      method: 'GET',
      path: '/weather/:location',
      handler: async (event) => {
        const { location } = event.context.params
        const apiKey = useRuntimeConfig().weatherApiKey
        
        const response = await $fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`
        )
        
        return response
      }
    }
  ]
})
```

## Advanced Topics

### Server-Side Data Provider

```typescript
// dataProvider.ts
import { BaseDataProvider } from '@/lib/widgets/BaseDataProvider'

export class MyWidgetDataProvider extends BaseDataProvider {
  async getData(config: MyWidgetConfig) {
    // Fetch data from external API
    const data = await fetchExternalData(config)
    return data
  }
  
  async validateConfig(config: MyWidgetConfig) {
    // Validate configuration
    return { valid: true }
  }
}
```

### Custom Widget Events

```typescript
// Emit events from widget
const emit = defineEmits<{
  'data-updated': [data: any]
  'error': [error: Error]
}>()

// Listen in parent
<MyWidget @data-updated="handleUpdate" @error="handleError" />
```

### Widget Communication

```typescript
// Use event bus for cross-widget communication
import { useWidgetEventBus } from '@/composables'

const eventBus = useWidgetEventBus()

// Emit event
eventBus.emit('weather-updated', { temp: 25 })

// Listen for events
eventBus.on('weather-updated', (data) => {
  console.log('Weather updated:', data)
})
```

## Troubleshooting

### Common Issues

1. **Widget not appearing**: Check that plugin.ts exports default
2. **Configuration not saving**: Ensure schema matches defaultConfig
3. **API routes not working**: Verify route registration and paths

### Debug Checklist

- [ ] Widget files in correct location
- [ ] Plugin properly exported
- [ ] Configuration schema valid
- [ ] Component props match config type
- [ ] No console errors

For more help, check the example widgets in the `widgets/` directory.