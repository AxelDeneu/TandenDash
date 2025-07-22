# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TandenDash is a customizable dashboard application built with Nuxt 3, Vue 3, and TypeScript. It features a widget-based architecture where users can add, configure, and position widgets on a grid-based layout. The application supports multiple dashboard pages, dark/light mode theming, and persistent data storage via SQLite.

- This project is intended to be used on a 24" touch-screen
- This project is not intended to be used on mobile phones
- Compatibility with tablets can be a plus 

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
- **Utils Layer** (`lib/utils`): All util code that could be used accross the app
- **Common Widget Layer** (`lib/widgets`): Common code used in the widget system
- **Widgets Instances** (`widgets`): The place where resides all the widgets of the app
- **API Layer** (`server/api/`): HTTP endpoints using dependency injection
- **UI Layer** (`components/`, `composables/`): Vue components and composables
- **Dependency Injection** (`lib/di/container.ts`): Centralized DI container

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

### Code Conventions
- Use `<script setup>` syntax with Composition API
- TypeScript with types (not interfaces), avoid enums
- PascalCase for components, camelCase for composables
- Lowercase with dashes for directories
- Mobile-first responsive design with Tailwind CSS

### Code Quality Guidelines
- Type definition should be strict
- SOLID principles are at the core of the project
- Code must be TypeScript first
- Code must be clean and maintenable
- Code must not be over-engineered

### Project Principles
- `<script setup>` must always be at the top of the file
- Code coverage must be at least 80%

## Language Guidelines
- **Language Switching**: 
  - When communicating: French language will be used
  - When coding: Code will be written in English

## Claude AI Guidelines
- Never start or kill a dev server. Ask me for the url when you need to check if everything is working and remember to use PlayWright MCP to check the website
- You must test every functionality you create. Use playwright tests only
- Your code must pass when using `tsc`. You cannot end your task until `tsc` passes
- At the end of the task I asked you, you MUST always propose a commit, with commitizen syntax and without your watermark
- Never commit by yourself, I must valide your proposed commit
- Never put yourself as a co-author in the commit
- Never add hard-coded strings, always translatable strings