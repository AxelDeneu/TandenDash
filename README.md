# TandenDash - Customizable Touch-Optimized Dashboard

TandenDash is a modern, customizable dashboard application built with Nuxt 3, Vue 3, and TypeScript. Designed specifically for 24" touchscreen displays, it features a widget-based architecture where users can add, configure, and position widgets on a grid-based layout.

## Features

- 🎯 **Widget-Based Architecture**: Extensible plugin system for adding custom widgets
- 📱 **Touch-First Design**: Optimized for 24" touchscreen displays with gesture support
- 🎨 **Theme Support**: Dark/light mode with triple-tap gesture switching
- 📐 **Grid System**: Configurable grid layout with optional snapping and margins
- 💾 **Persistent Storage**: SQLite database for storing widget configurations and positions
- 🔌 **Plugin System**: True extensibility with comprehensive lifecycle hooks
- ⚡ **Performance Optimized**: Lazy loading, shimmer effects, and efficient state management
- 🏗️ **SOLID Architecture**: Clean separation of concerns with dependency injection

## Architecture Overview

```
TandenDash/
├── components/           # Vue components
│   ├── widgets/         # Widget components and system
│   ├── dashboard/       # Dashboard UI components
│   ├── dialogs/         # Dialog components
│   └── ui/              # Shadcn Vue UI components
├── composables/         # Vue composables (state & logic)
│   ├── core/           # Core composables (DI, error handling)
│   ├── data/           # Data operation composables
│   ├── widgets/        # Widget-specific composables
│   └── events/         # Event system composables
├── lib/                 # Business logic layer
│   ├── repositories/   # Data access layer (interfaces)
│   ├── services/       # Business logic services
│   ├── widgets/        # Widget plugin system
│   ├── di/            # Dependency injection container
│   └── db/            # Database configuration
├── server/             # Nitro server
│   └── api/           # API endpoints
├── types/              # TypeScript type definitions
└── plugins/            # Nuxt plugins
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- SQLite support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tandendash.git
cd tandendash

# Install dependencies
npm install

# Run database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Widget Development

TandenDash uses a comprehensive plugin system for widgets. See the [Widget Development Guide](./WIDGET_DEVELOPMENT_GUIDE.md) for detailed instructions on creating custom widgets.

### Quick Widget Example

```typescript
// lib/widgets/plugins/MyWidget/index.ts
export const myWidgetPlugin: WidgetPluginManifest = {
  metadata: {
    id: 'my-widget',
    name: 'My Widget',
    version: '1.0.0',
    description: 'A custom widget',
    author: 'Your Name',
    category: 'custom',
    tags: ['example'],
    permissions: ['storage:read']
  },
  
  renderer: {
    component: () => import('./MyWidget.vue'),
    loadingComponent: () => import('./MyWidgetSkeleton.vue'),
    errorComponent: () => import('./MyWidgetError.vue')
  },
  
  configManager: {
    defaultConfig: { /* ... */ },
    schema: myWidgetConfigSchema,
    migrations: []
  },
  
  lifecycle: {
    onMount: async (instance) => { /* ... */ },
    onUnmount: async (instance) => { /* ... */ },
    onConfigChange: async (instance, oldConfig, newConfig) => { /* ... */ }
  }
}
```

## Usage

### Adding Widgets

1. Enter edit mode by clicking the edit button in the bottom toolbar
2. Click the "+" button to add a new widget
3. Select the widget type from the dialog
4. Position and resize the widget by dragging

### Page Management

- **Create Pages**: Use the settings menu to add new dashboard pages
- **Configure Grid**: Set grid dimensions and enable snapping in page settings
- **Set Margins**: Define screen edge margins to keep widgets within bounds
- **Switch Pages**: Use swipe gestures or page indicators in the toolbar

### Gestures & Shortcuts

- **Triple-tap center**: Toggle dark/light mode
- **Swipe left/right**: Navigate between pages
- **Long press widget**: Enter widget edit mode (when in edit mode)
- **Middle-click** (coming soon): Show/hide toolbar
- **4-finger touch for 2s** (coming soon): Show/hide toolbar

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=./data.db

# Development
NODE_ENV=development

# API Configuration
NITRO_PORT=3000
```

### Database Schema

The application uses SQLite with Drizzle ORM. Key tables include:

- `pages`: Dashboard pages with grid configuration
- `widgetInstance`: Widget instances with positions and configs
- `todoList/todoItem`: Todo widget data
- `modeState`: Theme preferences

## Development

### Code Style

- **Components**: PascalCase, `<script setup>` syntax
- **Composables**: camelCase, `use` prefix
- **Directories**: lowercase with dashes
- **TypeScript**: Strict mode, prefer types over interfaces

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Architecture Principles

TandenDash follows SOLID principles throughout:

- **Single Responsibility**: Each component/service has one clear purpose
- **Open/Closed**: Widget plugin system allows extension without modification
- **Liskov Substitution**: All repositories implement consistent interfaces
- **Interface Segregation**: Focused interfaces for different concerns
- **Dependency Inversion**: Services depend on repository interfaces, not implementations

## Security

- Input validation using Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS protection through Vue's template system
- CSRF protection in API endpoints
- Widget permissions system for sandboxing

## Performance

- Lazy loading for widgets and routes
- Efficient SQLite configuration with WAL mode
- Debounced operations for drag/resize
- Virtual scrolling for large lists
- Service worker for offline capability (planned)

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

- Built with [Nuxt 3](https://nuxt.com/)
- UI components from [Shadcn Vue](https://www.shadcn-vue.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
- Icons from [Lucide](https://lucide.dev/)

---

For more detailed documentation:
- [Widget Development Guide](./WIDGET_DEVELOPMENT_GUIDE.md)
- [Touch Improvements Guide](./TOUCH_IMPROVEMENTS.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (coming soon)