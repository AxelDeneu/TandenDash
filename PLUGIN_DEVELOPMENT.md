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
- **apiRoutes** (optional): Array of API routes for backend functionality

## Getting Started

### Plugin Export Naming Convention

**IMPORTANT**: Your plugin export MUST follow the naming convention:
`export const [WidgetName]WidgetPlugin`

For example:
- Widget name: `TaskCounter` → Export name: `TaskCounterWidgetPlugin`
- Widget name: `Calendar` → Export name: `CalendarWidgetPlugin`
- Widget name: `Clock` → Export name: `ClockWidgetPlugin`

This naming convention is required by the automatic plugin discovery system. The system extracts the widget name from the directory path and expects to find an export with the exact name `[WidgetName]WidgetPlugin`.

### 1. Create Widget Directory Structure

```
widgets/MyWidget/
├── index.vue          # Main component
├── definition.ts      # Types and defaults
├── plugin.ts          # Plugin definition (must export MyWidgetWidgetPlugin)
├── api.ts             # Optional: API routes for backend functionality
├── package.json       # Optional: Widget-specific npm dependencies
└── node_modules/      # Generated: Widget's isolated dependencies
```

### 2. Define Widget Types and Defaults

**`widgets/MyWidget/definition.ts`**

```typescript
import type { BaseWidgetConfig } from '@/types/widget'
import { z } from 'zod'

export interface WidgetConfig extends BaseWidgetConfig {
  title: string
  color: string
  showBorder: boolean
  updateInterval: number
}

export const widgetDefaults: Required<Omit<WidgetConfig, keyof BaseWidgetConfig>> = {
  title: 'My Widget',
  color: '#3b82f6',
  showBorder: true,
  updateInterval: 30000,
  minWidth: 300,
  minHeight: 200
}

export const WidgetConfigSchema = z.object({
  title: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  showBorder: z.boolean(),
  updateInterval: z.number().min(1000).max(300000),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

// Widget configuration groups for UI
export const widgetConfig = {
  groups: [
    {
      id: 'display',
      label: 'Display Settings',
      description: 'Configure what information to show',
      defaultOpen: true,
      options: {
        title: {
          type: 'text',
          label: 'Widget Title',
          description: 'The title displayed at the top of the widget',
          placeholder: 'My Widget'
        },
        showBorder: {
          type: 'toggle',
          label: 'Show Border',
          description: 'Display a colored border around the widget'
        },
        updateInterval: {
          type: 'slider',
          label: 'Update Interval',
          description: 'How often to update the widget (in milliseconds)',
          min: 1000,
          max: 300000,
          step: 1000,
          unit: 'ms'
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize colors and styling',
      collapsible: true,
      options: {
        color: {
          type: 'color',
          label: 'Accent Color',
          description: 'The primary color for the widget theme'
        }
      }
    }
  ]
}
```

### 3. Create Widget Component

**`widgets/MyWidget/index.vue`**

```vue
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
      Your widget content here
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WidgetConfig } from './definition'

const props = defineProps<WidgetConfig & { id?: number }>()
</script>
```

## Widget Plugin Interface

### Basic Plugin Structure

**`widgets/MyWidget/plugin.ts`**

```typescript
import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults } from './definition'
import MyWidgetComponent from './index.vue'

export const MyWidgetWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'my-widget',
  name: 'My Widget',
  description: 'A custom widget for demonstration',
  version: '1.0.0',
  icon: '🔧',
  category: 'productivity',
  tags: ['demo', 'example'],
  component: MyWidgetComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
  // Optional: Add API routes if your widget needs backend functionality
  // apiRoutes: myWidgetApiRoutes
}
```

## Widget Dependencies

### Installing Widget-Specific Packages

Widgets can have their own npm dependencies, completely isolated from the main application and other widgets.

#### Creating a Widget with Dependencies

1. **Create a `package.json` in your widget directory:**

**`widgets/MyWidget/package.json`**
```json
{
  "name": "@tandendash/widget-mywidget",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "chart.js": "^4.4.0",
    "moment": "^2.29.4",
    "lodash": "^4.17.21"
  }
}
```

2. **Install dependencies:**

When you run `npm install` in the project root, it automatically installs widget dependencies:

```bash
npm install  # This also runs npm run widgets:install
```

Or manually install widget dependencies:

```bash
npm run widgets:install
```

3. **Use the dependencies in your widget:**

**`widgets/MyWidget/index.vue`**
```vue
<script setup lang="ts">
import Chart from 'chart.js/auto'
import moment from 'moment'
import { debounce } from 'lodash'

// These imports work because they're installed in widgets/MyWidget/node_modules/
</script>
```

#### How It Works

- Each widget has its own `node_modules` directory
- Dependencies are completely isolated between widgets
- Two widgets can use different versions of the same package
- No conflicts with the main application dependencies
- Imports work naturally with Node.js module resolution

#### Best Practices

1. **Keep dependencies minimal** - Only include what you actually need
2. **Use specific versions** - Avoid using `latest` or `*`
3. **Document required dependencies** - List them in your widget documentation
4. **Test with clean installs** - Ensure your widget works on fresh installations

## Widget Component

### Component Props

Your widget component will receive all configuration properties plus an optional `id`:

```vue
<script setup lang="ts">
import type { WidgetConfig } from './definition'

// Props include all config properties plus id
const props = defineProps<WidgetConfig & { id?: number }>()

// Access configuration
console.log(props.title)     // string
console.log(props.color)     // string
console.log(props.id)        // number | undefined
</script>
```

### Reactive Updates

The component will automatically re-render when configuration changes:

```vue
<script setup lang="ts">
import { watch } from 'vue'
import type { WidgetConfig } from './definition'

const props = defineProps<WidgetConfig & { id?: number }>()

// Watch for config changes
watch(() => props.updateInterval, (newInterval) => {
  console.log('Update interval changed:', newInterval)
})
</script>
```

## Widget Data Storage

### Persistent Storage per Instance

TandenDash provides a powerful data storage system that allows each widget instance to store its own persistent data. This is perfect for storing user preferences, cached data, or any information specific to a widget instance.

#### Using the useWidgetData Composable

The `useWidgetData` composable provides persistent storage for each widget instance. The widget receives its instance ID automatically through the `id` prop.

**`widgets/MyWidget/index.vue`**
```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useWidgetData } from '@/composables/data/useWidgetData'
import type { WidgetConfig } from './definition'

interface Props extends WidgetConfig {
  id?: number  // This is provided automatically by WidgetCard
}

const props = defineProps<Props>()

// Initialize widget data storage
// Note: During widget creation, id might be undefined. The composable handles this gracefully.
const widgetData = useWidgetData(props.id)

// Store a single value
async function saveUserPreference(theme: string) {
  await widgetData.set('theme', theme)
}

// Retrieve a value with type safety
const theme = widgetData.get<string>('theme') || 'light'

// Store multiple values at once
async function saveSettings() {
  await widgetData.setMultiple({
    theme: 'dark',
    fontSize: 16,
    showLabels: true,
    lastUpdated: new Date().toISOString()
  })
}

// Remove a value
async function resetTheme() {
  await widgetData.remove('theme')
}

// Clear all data for this instance
async function resetWidget() {
  await widgetData.clear()
}

// Access reactive state
const isLoading = widgetData.loading
const hasError = widgetData.error
const allKeys = widgetData.keys  // Reactive list of all stored keys
</script>
```

#### Storage Features

1. **Instance Isolation**: Each widget instance has its own storage space
2. **Type Safety**: Full TypeScript support with generic types
3. **Reactive State**: Loading, error, and data states are reactive
4. **Automatic JSON Serialization**: Complex objects are automatically serialized
5. **Optimistic Updates**: UI updates immediately while saving in background
6. **Error Recovery**: Failed updates automatically revert to previous state

#### API Reference

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

// Clear completed tasks
async function clearCompleted() {
  tasks.value = tasks.value.filter(t => !t.completed)
  await widgetData.set('tasks', tasks.value)
}
</script>
```

#### Best Practices

1. **Use meaningful keys**: Choose descriptive keys like 'userSettings' instead of 'data1'
2. **Handle loading states**: Show loading indicators during async operations
3. **Type your data**: Always use TypeScript generics for type safety
4. **Batch updates**: Use `setMultiple` when updating multiple values
5. **Clean up**: Remove unused data to keep storage efficient

## API Routes

TandenDash provides a dynamic API route system that allows widgets to define their own backend endpoints without modifying the core server directory.

### Defining Widget API Routes

Create an `api.ts` file in your widget directory to define custom API routes:

**`widgets/MyWidget/api.ts`**

```typescript
import type { WidgetApiRoute } from '@/lib/widgets/api-routes'
import { getQuery, createError } from 'h3'

export const myWidgetApiRoutes: WidgetApiRoute[] = [
  {
    method: 'GET',
    path: 'data',
    handler: async (event) => {
      const { id } = getQuery(event) as { id?: string }
      
      if (!id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ID parameter is required'
        })
      }
      
      // Your API logic here
      return {
        id,
        data: 'Your data here',
        timestamp: new Date().toISOString()
      }
    }
  },
  {
    method: 'POST',
    path: 'update',
    handler: async (event) => {
      const body = await readBody(event)
      
      // Process the update
      return {
        success: true,
        message: 'Updated successfully'
      }
    }
  }
]
```

### API Route Interface

The `WidgetApiRoute` interface defines the structure for widget API routes:

```typescript
interface WidgetApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  handler: (event: H3Event) => Promise<any> | any
}
```

### Dynamic Route System

Widget API routes are automatically available at `/api/widgets/[type]/[...path]` where:
- `[type]` is your widget ID (e.g., 'weather', 'my-widget')
- `[...path]` is the path defined in your route

For example:
- Widget ID: `weather`, Route path: `current` → `/api/widgets/weather/current`
- Widget ID: `todo`, Route path: `items/list` → `/api/widgets/todo/items/list`

### Using Environment Variables

For API keys and sensitive configuration:

**`.env`**
```env
NUXT_MY_WIDGET_API_KEY=your-api-key-here
NUXT_MY_WIDGET_API_URL=https://api.example.com
```

**Access in your API handler:**
```typescript
handler: async (event) => {
  const apiKey = process.env.NUXT_MY_WIDGET_API_KEY
  const apiUrl = process.env.NUXT_MY_WIDGET_API_URL
  
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API key not configured'
    })
  }
  
  // Use the API key for external requests
  const response = await $fetch(`${apiUrl}/endpoint`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })
  
  return response
}
```

### Error Handling

Always handle errors gracefully in your API routes:

```typescript
handler: async (event) => {
  try {
    // Your API logic
    const data = await fetchExternalData()
    return data
  } catch (error) {
    console.error('API error:', error)
    
    // Return appropriate error response
    throw createError({
      statusCode: error.statusCode || 503,
      statusMessage: error.message || 'Service unavailable'
    })
  }
}
```

### Calling Widget APIs from Components

Use the widget API routes in your component:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const data = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchData() {
  loading.value = true
  error.value = null
  
  try {
    // Call your widget's API route
    const response = await $fetch('/api/widgets/my-widget/data', {
      query: { id: props.id }
    })
    
    data.value = response
  } catch (err) {
    error.value = err.message
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
```

### Best Practices for Widget APIs

1. **Security**: Always validate input parameters and sanitize data
2. **Error Handling**: Provide meaningful error messages for debugging
3. **Performance**: Cache responses when appropriate
4. **Rate Limiting**: Consider implementing rate limiting for external API calls
5. **Logging**: Log errors for monitoring and debugging
6. **Environment Variables**: Store API keys and secrets in environment variables
7. **Type Safety**: Use TypeScript types for request/response data
8. **Documentation**: Document your API routes and their parameters

### Important Notes

- Widget API routes are automatically registered when the widget is loaded
- Routes are namespaced by widget ID to prevent conflicts
- The catch-all handler at `/api/widgets/[type]/[...path]` manages all widget routes
- Currently, widget API routes must be manually registered in the catch-all handler
- Future versions may support automatic discovery of widget API routes

## Configuration & Validation

### Using Zod for Schema Validation

Define your widget's validation schema in your definition file:

```typescript
// widgets/MyWidget/definition.ts
import { z } from 'zod'

export const WidgetConfigSchema = z.object({
  title: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  showBorder: z.boolean(),
  updateInterval: z.number().min(1000).max(300000),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})
```

The validation schema is automatically registered when the plugin is discovered. No manual registration is required.

## Widget Configuration UI

### The widgetConfig Export

**IMPORTANT**: The `widgetConfig` export is required for your widget to appear in the widget list. This defines the configuration UI that users will see when adding or configuring your widget.

The `widgetConfig` export defines:
- **Groups**: Organize related configuration options
- **Control Types**: How each option is displayed (toggle, slider, text, etc.)
- **Labels & Descriptions**: User-friendly names and help text
- **Validation**: Min/max values, dependencies between options
- **UI Behavior**: Which groups are collapsible, default open state

### Available Control Types

```typescript
// Toggle - Boolean on/off switch
{
  type: 'toggle',
  label: 'Enable Feature',
  description: 'Turn this feature on or off'
}

// Slider - Numeric input with range
{
  type: 'slider',
  label: 'Font Size',
  description: 'Size of the text',
  min: 12,
  max: 48,
  step: 2,
  unit: 'px'
}

// Text - String input field
{
  type: 'text',
  label: 'Title',
  description: 'Widget title text',
  placeholder: 'Enter title...'
}

// Color - Color picker
{
  type: 'color',
  label: 'Accent Color',
  description: 'Primary color for the widget'
}

// Select - Dropdown with options
{
  type: 'select',
  label: 'Theme',
  description: 'Choose a theme',
  options: [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ]
}

// Radio - Single choice from multiple options
{
  type: 'radio',
  label: 'Layout',
  description: 'Choose layout direction',
  options: [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical' }
  ]
}
```

### Group Configuration

Groups help organize related options:

```typescript
export const widgetConfig = {
  groups: [
    {
      id: 'display',           // Unique identifier
      label: 'Display',        // User-visible name
      description: 'Display settings',  // Help text
      defaultOpen: true,       // Open by default
      options: {
        // ... option definitions
      }
    },
    {
      id: 'advanced',
      label: 'Advanced',
      description: 'Advanced options',
      collapsible: true,       // Can be collapsed
      options: {
        // ... option definitions
      }
    }
  ]
}
```

### Dependencies and Conditional Options

Show options only when certain conditions are met:

```typescript
{
  type: 'slider',
  label: 'Animation Speed',
  description: 'Speed of animations',
  min: 100,
  max: 2000,
  unit: 'ms',
  dependencies: { enableAnimations: true }  // Only show when enableAnimations is true
}
```

### Complete Example

Here's a complete `widgetConfig` with multiple groups and option types:

```typescript
export const widgetConfig = {
  groups: [
    {
      id: 'content',
      label: 'Content',
      description: 'Configure widget content',
      defaultOpen: true,
      options: {
        title: {
          type: 'text',
          label: 'Title',
          description: 'Widget title text',
          placeholder: 'Enter title...'
        },
        showSubtitle: {
          type: 'toggle',
          label: 'Show Subtitle',
          description: 'Display subtitle below title'
        },
        subtitle: {
          type: 'text',
          label: 'Subtitle',
          description: 'Subtitle text',
          placeholder: 'Enter subtitle...',
          dependencies: { showSubtitle: true }
        }
      }
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize visual appearance',
      collapsible: true,
      options: {
        theme: {
          type: 'select',
          label: 'Theme',
          description: 'Choose color theme',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' }
          ]
        },
        accentColor: {
          type: 'color',
          label: 'Accent Color',
          description: 'Primary color for highlights'
        },
        fontSize: {
          type: 'slider',
          label: 'Font Size',
          description: 'Size of text content',
          min: 12,
          max: 32,
          step: 2,
          unit: 'px'
        }
      }
    }
  ]
}
```

## Registration Process

### 1. Create Your Plugin

Follow the structure above to create your widget plugin.

### 2. Automatic Registration

The widget system uses an automatic plugin discovery system. Simply create your widget plugin file in the correct location:

```
widgets/MyWidget/
├── index.vue          # Main component
├── definition.ts      # Types, defaults, and validation schema
└── plugin.ts          # Plugin manifest
```

The system will automatically:
- Discover your plugin on startup
- Register it in the plugin registry
- Register its validation schema
- Make it available in the "Add Widget" dialog

### 3. Plugin Discovery

The plugin discovery system (`lib/widgets/PluginDiscovery.ts`) automatically:
- Scans for widget plugins in `widgets/*/plugin.ts`
- Validates plugin definitions
- Registers plugins and their validation schemas
- Handles hot reload in development mode

### 4. Restart Development Server

```bash
npm run dev
```

Your widget will now be available in the "Add Widget" dialog automatically.

## Testing & Debugging

### Development Console

Monitor widget registration in the browser console. The plugin discovery system logs all discovered and registered widgets.

### Error Handling

Handle errors gracefully in your component:

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<string | null>(null)

onErrorCaptured((err) => {
  error.value = err.message
  console.error('Widget error:', err)
  return false
})
</script>

<template>
  <div v-if="error" class="error-state">
    Error: {{ error }}
  </div>
  <div v-else>
    <!-- Normal widget content -->
  </div>
</template>
```

### Widget System Health Check

Check widget system status:

```typescript
import { widgetSystem } from '@/lib/widgets/WidgetSystem'

// Get system info
const info = widgetSystem.getSystemInfo()
console.log('Widget system info:', info)

// Perform health check
const health = await widgetSystem.performHealthCheck()
console.log('Health check:', health)
```

## Best Practices

### 1. Type Safety

Use strict TypeScript types for all configurations:

```typescript
export interface WidgetConfig extends BaseWidgetConfig {
  readonly title: string
  readonly color: `#${string}`  // Template literal type
  readonly showBorder: boolean
  readonly updateInterval: number
}
```

### 2. Validation

Implement comprehensive validation:

```typescript
export const WidgetConfigSchema = z.object({
  title: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  showBorder: z.boolean(),
  updateInterval: z.number().min(1000).max(300000)
})
```

### 3. Error Handling

Always handle errors gracefully:

```vue
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<string | null>(null)

onErrorCaptured((err) => {
  error.value = err.message
  return false
})
</script>
```

### 4. Performance

Optimize for performance:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

// Use computed for expensive calculations
const expensiveComputation = computed(() => {
  return heavyCalculation(props.data)
})

// Avoid watchers on frequently changing props
// Use computed instead
</script>
```

### 5. Accessibility

Make widgets accessible:

```vue
<template>
  <div
    role="region"
    :aria-label="title"
    tabindex="0"
    @keydown.enter="handleActivate"
  >
    <h2 :id="titleId">{{ title }}</h2>
    <div :aria-labelledby="titleId">
      <!-- Widget content -->
    </div>
  </div>
</template>
```

## Examples

### Weather Widget with API Routes

Here's a complete example of a widget that uses API routes:

**`widgets/Weather/api.ts`**
```typescript
import type { WidgetApiRoute } from '@/lib/widgets/api-routes'
import { getQuery, createError } from 'h3'

export const weatherApiRoutes: WidgetApiRoute[] = [
  {
    method: 'GET',
    path: 'current',
    handler: async (event) => {
      const { location } = getQuery(event) as { location?: string }
      
      if (!location) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Location parameter is required'
        })
      }
      
      // Fetch weather data from external API
      const apiKey = process.env.NUXT_WEATHER_API_KEY
      
      try {
        const response = await $fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
        )
        
        return {
          location: response.name,
          temperature: Math.round(response.main.temp),
          conditions: response.weather[0].description,
          icon: response.weather[0].icon,
          humidity: response.main.humidity,
          windSpeed: Math.round(response.wind.speed * 3.6) // Convert m/s to km/h
        }
      } catch (error) {
        console.error('Weather API error:', error)
        throw createError({
          statusCode: 503,
          statusMessage: 'Weather service unavailable'
        })
      }
    }
  }
]
```

**`widgets/Weather/plugin.ts`**
```typescript
import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WeatherWidgetConfig } from './definition'
import WeatherComponent from './index.vue'
import { widgetDefaults, WidgetConfigSchema } from './definition'
import { weatherApiRoutes } from './api'

export const WeatherWidgetPlugin: WidgetPlugin<WeatherWidgetConfig> = {
  id: 'weather',
  name: 'Weather Widget',
  description: 'Display current weather conditions',
  version: '1.0.0',
  icon: '🌤️',
  category: 'Weather & Environment',
  tags: ['weather', 'temperature', 'conditions'],
  component: WeatherComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: ['network'],
  apiRoutes: weatherApiRoutes  // Register the API routes
}
```

**`widgets/Weather/index.vue`**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { WeatherWidgetConfig } from './definition'

const props = defineProps<WeatherWidgetConfig & { id?: number }>()

const weatherData = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchWeather() {
  if (!props.location) return
  
  loading.value = true
  error.value = null
  
  try {
    // Call the widget's API route
    const data = await $fetch('/api/widgets/weather/current', {
      query: { location: props.location }
    })
    
    weatherData.value = data
  } catch (err) {
    error.value = 'Failed to load weather data'
    console.error('Weather fetch error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWeather()
})
</script>

<template>
  <div class="weather-widget p-4">
    <h3 class="text-lg font-bold mb-2">{{ location }}</h3>
    
    <div v-if="loading" class="text-center">
      Loading weather...
    </div>
    
    <div v-else-if="error" class="text-red-500">
      {{ error }}
    </div>
    
    <div v-else-if="weatherData" class="weather-info">
      <div class="temperature text-3xl font-bold">
        {{ weatherData.temperature }}°C
      </div>
      <div class="conditions capitalize">
        {{ weatherData.conditions }}
      </div>
      <div class="details text-sm mt-2">
        <span>Humidity: {{ weatherData.humidity }}%</span>
        <span class="ml-4">Wind: {{ weatherData.windSpeed }} km/h</span>
      </div>
    </div>
  </div>
</template>
```

### Calendar Widget

```typescript
import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults } from './definition'
import CalendarComponent from './index.vue'

export const CalendarWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'calendar',
  name: 'Calendar',
  description: 'A touch-friendly calendar widget for viewing dates and months',
  version: '1.0.0',
  icon: '📅',
  category: 'productivity',
  tags: ['calendar', 'date', 'time', 'schedule'],
  component: CalendarComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
}
```

### Complete Example: Counter Widget with Data Storage

Here's a complete example of a widget that uses data storage and external dependencies:

**`widgets/Counter/package.json`**
```json
{
  "name": "@tandendash/widget-counter",
  "version": "1.0.0",
  "dependencies": {
    "animate.css": "^4.1.1"
  }
}
```

**`widgets/Counter/definition.ts`**
```typescript
import { z } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'

export interface WidgetConfig extends BaseWidgetConfig {
  title: string
  incrementBy: number
  animateChanges: boolean
}

export const widgetDefaults: WidgetConfig = {
  title: 'My Counter',
  incrementBy: 1,
  animateChanges: true,
  minWidth: 200,
  minHeight: 150
}

export const WidgetConfigSchema = z.object({
  title: z.string(),
  incrementBy: z.number().min(1).max(10),
  animateChanges: z.boolean(),
  minWidth: z.number().min(100),
  minHeight: z.number().min(100)
})

export const widgetConfig = {
  groups: [
    {
      id: 'general',
      label: 'General Settings',
      defaultOpen: true,
      options: {
        title: {
          type: 'text',
          label: 'Widget Title',
          description: 'Title displayed at the top'
        },
        incrementBy: {
          type: 'slider',
          label: 'Increment By',
          description: 'Amount to increment on each click',
          min: 1,
          max: 10,
          step: 1
        },
        animateChanges: {
          type: 'toggle',
          label: 'Animate Changes',
          description: 'Show animations when counter changes'
        }
      }
    }
  ]
}
```

**`widgets/Counter/index.vue`**
```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useWidgetData } from '@/composables/data/useWidgetData'
import 'animate.css'
import type { WidgetConfig } from './definition'

interface Props extends WidgetConfig {
  id?: number
}

const props = defineProps<Props>()

// Initialize widget data storage
const widgetData = useWidgetData(props.id)

// Load saved count or start at 0
const count = ref<number>(widgetData.get<number>('count') || 0)
const animationClass = ref('')

// Save count whenever it changes
watch(count, async (newCount) => {
  await widgetData.set('count', newCount)
  
  // Trigger animation
  if (props.animateChanges) {
    animationClass.value = 'animate__animated animate__pulse'
    setTimeout(() => {
      animationClass.value = ''
    }, 1000)
  }
})

// Increment function
function increment() {
  count.value += props.incrementBy
}

// Reset function
async function reset() {
  count.value = 0
  await widgetData.remove('count')
}

// Load last updated time
const lastUpdated = ref<string | null>(null)

onMounted(async () => {
  lastUpdated.value = widgetData.get<string>('lastUpdated') || null
  await widgetData.set('lastUpdated', new Date().toISOString())
})
</script>

<template>
  <div class="h-full w-full p-4 flex flex-col">
    <h3 class="text-lg font-bold mb-4">{{ title }}</h3>
    
    <div class="flex-1 flex items-center justify-center">
      <div 
        class="text-5xl font-bold" 
        :class="animationClass"
      >
        {{ count }}
      </div>
    </div>
    
    <div class="flex gap-2 mt-4">
      <button
        @click="increment"
        class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        +{{ incrementBy }}
      </button>
      <button
        @click="reset"
        class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
      >
        Reset
      </button>
    </div>
    
    <div v-if="lastUpdated" class="text-xs text-muted-foreground mt-2">
      Last opened: {{ new Date(lastUpdated).toLocaleString() }}
    </div>
  </div>
</template>
```

**`widgets/Counter/plugin.ts`**
```typescript
import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults } from './definition'
import CounterComponent from './index.vue'

export const CounterWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'counter',
  name: 'Counter',
  description: 'A persistent counter with animations',
  version: '1.0.0',
  icon: '🔢',
  category: 'utility',
  tags: ['counter', 'tally', 'count'],
  component: CounterComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
}
```

This example demonstrates:
- Using `useWidgetData` for persistent storage
- Installing and using external npm packages (animate.css)
- Reactive data that persists across page reloads
- Configuration options that affect widget behavior
- Tracking metadata like last updated time

### Clock Widget

```typescript
import type { WidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults } from './definition'
import ClockComponent from './index.vue'

export const ClockWidgetPlugin: WidgetPlugin<WidgetConfig> = {
  id: 'clock',
  name: 'Digital Clock',
  description: 'A customizable digital clock widget',
  version: '1.0.0',
  icon: '🕐',
  category: 'time',
  tags: ['clock', 'time', 'digital'],
  component: ClockComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: []
}
```

## File Structure

When creating a new widget, follow this structure:

```
widgets/MyWidget/
├── index.vue                 # Main component
├── definition.ts             # Types, defaults, and validation schema
├── plugin.ts                 # Plugin manifest
├── api.ts                    # Optional: API routes for backend functionality
├── package.json              # Optional: Widget-specific npm dependencies
└── node_modules/             # Generated: Widget's isolated dependencies
```

Everything you need is contained within the widget directory. No modifications to core files are required.

## Summary

To create a new widget plugin:

1. **Create widget directory** in `widgets/MyWidget/`
2. **Create component** in `widgets/MyWidget/index.vue`
3. **Define types and validation** in `widgets/MyWidget/definition.ts`
4. **Create plugin manifest** in `widgets/MyWidget/plugin.ts`
5. **Restart development server**

The widget will be automatically discovered, registered, and made available in the "Add Widget" dialog.

### Key Benefits of the Current System

- **No manual registration** - widgets are automatically discovered
- **No core file modification** - add widgets without touching system files
- **Automatic validation** - schemas are registered automatically
- **Hot reload support** - development-time plugin reloading
- **Type safety** - full TypeScript support throughout

For more examples, check the existing widgets in the `widgets/` directory and their corresponding plugin definitions.