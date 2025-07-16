# Plugin Development Guide

TandenDash uses a plugin system for widgets that allows you to create custom widgets with proper lifecycle management and configuration.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
- [Widget Structure](#widget-structure)
- [Widget Plugin Interface](#widget-plugin-interface)
- [Widget Component](#widget-component)
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

### 1. Create Widget Directory Structure

```
widgets/MyWidget/
├── index.vue          # Main component
├── definition.ts      # Types and defaults
└── plugin.ts          # Plugin definition
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

export const MyWidgetPlugin: WidgetPlugin<WidgetConfig> = {
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
}
```

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
└── plugin.ts                 # Plugin manifest
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