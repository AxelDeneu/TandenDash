# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TandenDash is a customizable dashboard application built with Nuxt 3, Vue 3, and TypeScript. It features a widget-based architecture where users can add, configure, and position widgets on a grid-based layout. The application supports multiple dashboard pages, dark/light mode theming, and persistent data storage via SQLite.

- This project is intended to be used on a 24" touch-screen

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Database migrations (Drizzle)
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Architecture

### Layered Architecture (Following SOLID Principles)
- **Repository Layer** (`lib/repositories/`): Data access abstraction with interfaces
- **Service Layer** (`lib/services/`): Business logic and domain operations
- **API Layer** (`server/api/`): HTTP endpoints using dependency injection
- **UI Layer** (`components/`, `composables/`): Vue components and composables
- **Dependency Injection** (`lib/di/container.ts`): Centralized DI container

### MIGRATION COMPLETE - All 4 Phases Implemented ✅

The codebase has been successfully migrated to follow SOLID principles and strict type definitions through a comprehensive 4-phase refactoring:

### Widget Plugin System (Phase 3 Complete)
- **Plugin Architecture**: True extensibility with `WidgetPluginManifest` system
- **Lifecycle Management**: Comprehensive hooks (onMount, onUnmount, onUpdate, onResize, onConfigChange, onError)
- **Separation of Concerns**: 
  - Renderer (`IWidgetRenderer`): Component rendering and mounting
  - Config Manager (`IWidgetConfigManager`): Configuration validation and management
  - Data Provider (`IWidgetDataProvider`): Data fetching and subscription
- **Error Boundaries**: Automatic error recovery and isolation (`WidgetErrorBoundary`)
- **Plugin Registry**: Dynamic registration and discovery system
- **Validation System**: Multi-layered validation (metadata, config, security, performance)
- **Instance Manager**: Complete widget lifecycle and state management
- **Hot Reload**: Development-time plugin reloading capabilities

### Database Schema (SQLite + Drizzle ORM)
- **widgetInstance**: Stores widget positions, configurations, and page associations
- **pages**: Dashboard pages with grid settings and snapping options
- **todoList/todoItem**: Todo list widget data with hierarchical structure
- **modeState**: Persists dark/light mode preference

### Repository Pattern
- **Interfaces**: `IWidgetRepository`, `IPageRepository`, `ITodoListRepository`, etc.
- **Implementations**: Concrete classes handling database operations
- **Factory**: `RepositoryFactory` for dependency injection and testing
- **Validation**: Zod schemas for runtime type checking

### Service Layer
- **Business Logic**: Domain operations with proper error handling
- **Result Types**: `ServiceResult<T>` and `ServiceListResult<T>` for consistent responses
- **Dependency Injection**: Services receive repository interfaces via constructor
- **Error Handling**: Standardized error responses with descriptive messages

### Key Technologies
- **Nuxt 3**: Full-stack Vue framework with file-based routing
- **Drizzle ORM**: Type-safe SQLite database operations (`lib/db.ts`)
- **Pinia**: State management (auto-imported via `@pinia/nuxt`)
- **Shadcn Vue + Radix Vue**: UI component library with Tailwind CSS
- **GSAP**: Animation library for widget transitions
- **VueUse**: Utility composables

### Code Conventions (from Cursor rules)
- Use `<script setup>` syntax with Composition API
- TypeScript with types (not interfaces), avoid enums
- PascalCase for components, camelCase for composables
- Lowercase with dashes for directories
- Mobile-first responsive design with Tailwind CSS

### Special Features
- **Triple-tap Dark Mode**: Tap center of screen 3 times to toggle theme
- **Grid-based Layout**: Configurable grid system with optional snapping
- **Persistent State**: All widget configurations and positions saved to SQLite database
- **Plugin Extensibility**: Add new widgets without modifying core code
- **Error Recovery**: Automatic widget error handling and recovery
- **Real-time Updates**: Data providers with subscription-based updates
- **Security Validation**: Plugin security and permission validation

### Code Quality Guidelines
- Type definition should be strict

### Composables Architecture (Phase 4 Complete) ✅
- **Single Responsibility**: Each composable has one clear purpose
  - `useWidgetOperations`: Widget CRUD operations only
  - `useWidgetUI`: UI state management (selection, drag, resize)
  - `useEditMode`: Edit mode state and permissions
  - `useErrorHandler`: Structured error handling and retry logic
  - `useLoadingState`: Granular loading state management
- **Dependency Injection**: `useComposableContext()` provides services and events
- **Event-Driven**: Loose coupling via event emitter (`context.events`)
- **Error Handling**: Comprehensive error boundaries and recovery
- **Migration Complete**: All components now use the new architecture

### Migration Summary
✅ **Phase 1**: Type System Overhaul - Eliminated all 'any' types, created strict interfaces
✅ **Phase 2**: Repository Pattern - Data access abstraction, service layer, dependency injection  
✅ **Phase 3**: Widget System Redesign - Plugin architecture, lifecycle management, error boundaries
✅ **Phase 4**: Composables Refactoring - Single responsibility, dependency injection, event-driven communication

**Key Migration Files**:
- `app.vue`: Provides composable context via `provideComposableContext()`
- `pages/index.vue`: Migrated to use new composable architecture
- `components/widgets/AddWidgetDialog.vue`: Updated to use `useWidgetOperations`
- `composables/MIGRATION.md`: Complete migration guide
- `composables/core/ComposableContext.ts`: Client-side mock services to prevent database imports
- `composables/data/useWidgetOperations.ts`: API-based operations for client-side safety

### Migration Issues Resolved ✅
- **Promisify Error**: Fixed by preventing `better-sqlite3` from being bundled client-side
  - Created mock services for client-side composables
  - Updated widget operations to use API calls instead of direct service calls
  - Configured Vite to exclude database libraries from client bundle
  - Reduced client bundle size from 607kB to 334kB
- **Vue Injection Warning**: Fixed composable context provision timing
  - Moved `provideComposableContext()` from `onMounted` to component setup
  - Fixed missing `readonly` imports in composables
  - Ensured proper hydration between server and client contexts

### Project Principles
- SOLID principles are fully implemented throughout the codebase
- You must always follow the SOLID principles

## Language Guidelines
- **Language Switching**: 
  - When communicating: French language will be used
  - When coding: Code will be written in English