# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TandenDash is a customizable dashboard application built with Nuxt 3, Vue 3, and TypeScript. It features a widget-based architecture where users can add, configure, and position widgets on a grid-based layout. The application supports multiple dashboards with customizable settings, persistent data storage via SQLite, and internationalization.

### Target Platforms
- **Primary**: 24" touch-screen displays
- **Secondary**: Tablets (responsive design)
- **Not supported**: Mobile phones

### Key Features
- Multi-dashboard support with customizable settings per dashboard
- Widget plugin architecture with dynamic loading
- Internationalization (i18n) support
- Dark/light mode theming
- Touch-optimized UI components
- Real-time data synchronization

## Development Commands

```bash
# Install dependencies (includes widget dependencies)
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Widget management
npm run widgets:install    # Install widget dependencies

# Database migrations (Drizzle)
npx drizzle-kit generate   # Generate migration files
npx drizzle-kit migrate    # Apply migrations
npx drizzle-kit studio     # Visual database browser

# Testing
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run tests with UI mode
npm run test:e2e:headed    # Run tests in headed browser
npm run test:e2e:debug     # Debug tests
npm run test:e2e:db:reset  # Reset test database
npm run test:e2e:clean     # Clean test artifacts
npm run test:install       # Install Playwright browsers

# Type checking
tsc                        # Run TypeScript compiler
```

## Architecture

### Layered Architecture (Following SOLID Principles)
- **Repository Layer** (`lib/repositories/`): Data access abstraction with interfaces
- **Service Layer** (`lib/services/`): Business logic and domain operations
- **Schema Layer** (`server/schemas/`): Zod schemas for API validation and type safety
- **Utils Layer** (`lib/utils/`): Shared utilities across the application
- **Common Widget Layer** (`lib/widgets/`): Core widget system and interfaces
- **Widget Instances** (`widgets/`): Individual widget implementations
- **API Layer** (`server/api/`): HTTP endpoints using dependency injection
- **API Utils** (`server/utils/`): API handlers and response utilities
- **UI Layer** (`components/`, `composables/`): Vue components and composables
- **Dependency Injection** (`lib/di/container.ts`): Centralized DI container

### Database Schema (SQLite + Drizzle ORM)

#### Core Tables
- **dashboards**: Multi-dashboard support with default dashboard indicator
  - `id`, `name`, `isDefault`, `createdAt`, `updatedAt`
  
- **dashboardSettings**: Per-dashboard configuration
  - `dashboardId` (unique), `locale`, `measurementSystem`, `temperatureUnit`
  - `timeFormat`, `dateFormat`, `timezone`, `theme`
  - Indexes: `dashboardId` (unique constraint)

- **pages**: Dashboard pages with grid configuration
  - `id`, `name`, `dashboardId`, `snapping`, `gridRows`, `gridCols`
  - `marginTop`, `marginRight`, `marginBottom`, `marginLeft`
  - Indexes: `dashboardId`

- **widgetInstance**: Widget instances with positions and configurations
  - `id`, `type`, `position` (JSON), `options` (JSON), `pageId`
  - Indexes: `pageId`, `type`, composite `pageId+type`

- **widgetData**: Key-value storage for widget-specific data
  - `id`, `widgetInstanceId`, `key`, `value` (JSON)
  - Unique constraint: `widgetInstanceId + key`
  - Indexes: `widgetInstanceId`

#### Legacy Tables
- **modeState**: Global dark/light mode preference
- **todoList/todoItem**: Todo widget specific tables (being migrated to widgetData)

### Repository Pattern
- **Interfaces**: Type-safe contracts for data access
  - `IWidgetRepository`, `IPageRepository`, `IDashboardRepository`
  - `IWidgetDataRepository`, `IDashboardSettingsRepository`
- **Implementations**: Concrete classes with Drizzle ORM
- **Factory**: `RepositoryFactory` for dependency injection
- **Validation**: Runtime type checking with service layer
- **Performance**: Optimized queries with proper indexes

### Service Layer
- **Business Logic**: Domain operations with validation
- **Result Types**: 
  - `ServiceResult<T>`: Single item operations
  - `ServiceListResult<T>`: List operations with metadata
- **Services**: 
  - `WidgetService`: Widget CRUD operations
  - `PageService`: Page management
  - `DashboardService`: Dashboard operations
  - `WidgetDataService`: Widget data persistence
- **Dependency Injection**: Constructor-based DI
- **Error Handling**: Consistent error responses

### API Layer Patterns
- **Handler Pattern**: `defineApiHandler` for standardized endpoints
- **Context Injection**: Automatic service/repository injection
- **Validation Helpers**: 
  - `getValidatedBody`: Request body validation
  - `getValidatedQuery`: Query parameter validation
  - `getRouteParam`: Route parameter extraction
- **Response Utils**: `createApiResponse`, `handleApiError`
- **Performance Monitoring**: Built-in request timing
- **Schema Validation**: Zod schemas in `server/schemas/`

### Widget Plugin Architecture

#### Widget Structure
```
widgets/
└── WidgetName/
    ├── index.vue          # Main component
    ├── plugin.ts          # Plugin definition
    ├── definition.ts      # Config schema and defaults
    ├── api.ts            # API route definitions
    ├── handlers/         # API route handlers
    ├── components/       # Sub-components
    ├── composables/      # Widget-specific composables
    ├── services/         # Widget services
    ├── types/           # TypeScript types
    ├── utils/           # Widget utilities
    ├── lang/            # Translations
    │   ├── en.json
    │   ├── fr.json
    │   └── index.ts
    └── package.json      # Widget dependencies
```

#### Widget Plugin Interface
- **id**: Unique widget identifier
- **component**: Vue component
- **defaultConfig**: Default configuration
- **configSchema**: Zod schema for validation
- **dataProvider**: Optional data provider class
- **apiRoutes**: Widget-specific API endpoints
- **permissions**: Required permissions
- **settings**: Widget capabilities

### Key Technologies
- **Nuxt 3**: Full-stack Vue framework with file-based routing
- **Drizzle ORM**: Type-safe SQLite database operations (`lib/db.ts`)
- **Pinia**: State management (auto-imported via `@pinia/nuxt`)
- **Shadcn Vue + Radix Vue**: UI component library with Tailwind CSS
- **GSAP**: Animation library for widget transitions
- **VueUse**: Utility composables
- **Zod**: Runtime type validation for APIs
- **Playwright**: E2E testing framework
- **i18n**: Nuxt i18n module for internationalization

### Testing Strategy

#### E2E Testing with Playwright
- **Configuration**: `playwright.config.ts`
- **Test Database**: Separate `test.db` for isolation
- **Helpers**: 
  - `db-helper.ts`: Database utilities for tests
  - `console-helper.ts`: Console output helpers
- **Structure**:
  ```
  tests/e2e/
  ├── fixtures/       # Test fixtures
  ├── helpers/        # Test utilities
  ├── setup/          # Test setup
  └── specs/          # Test specifications
  ```

#### Test Requirements
- All new functionality must have E2E tests
- Tests must pass before marking tasks complete
- Use test database for data isolation
- Clean test artifacts between runs

### Code Conventions
- Use `<script setup>` syntax with Composition API
- TypeScript with types (not interfaces), avoid enums
- PascalCase for components, camelCase for composables
- Lowercase with dashes for directories
- Touch-first responsive design with Tailwind CSS
- Zod schemas for all API endpoints
- Always use translated strings (i18n)

### Code Quality Guidelines
- Type definition should be strict
- SOLID principles are at the core of the project
- Code must be TypeScript first
- Code must be clean and maintainable
- Code must not be over-engineered
- All functionality must have Playwright E2E tests
- Code must pass TypeScript compilation (`tsc`)

### Project Principles
- `<script setup>` must always be at the top of the file
- Code coverage must be at least 80%
- No hard-coded strings - use i18n translations
- No static widget imports outside widgets directory

## Language Guidelines
- **Language Switching**: 
  - When communicating: French language will be used
  - When coding: Code will be written in English

## Claude AI Guidelines
- Never start or kill a dev server. Ask me for the url when you need to check if everything is working and remember to use PlayWright MCP to check the website
- You must test every functionality you create. Use playwright tests only
- Your code must pass when using `tsc`. You cannot end your task until `tsc` passes
- At the end of the task I asked you, you MUST always propose a commit, with commitizen syntax and without your watermark
- Never commit by yourself, I must validate your proposed commit
- Never put yourself as a co-author in the commit
- Never add hard-coded strings, always translatable strings
- Never import widgets statically outside the widgets directory
- Use `defineApiHandler` pattern for all API endpoints
- Follow the established widget plugin architecture
- Ensure proper error handling with standardized responses
- Add appropriate indexes for database performance
- Use dependency injection for testability

## Important Architecture Decisions

### Multi-Dashboard System
- Each dashboard has its own settings (locale, units, theme)
- Dashboards contain multiple pages
- Only one dashboard can be default at a time
- Dashboard deletion cascades to pages and settings

### Widget Data Persistence
- Use `widgetData` table for new widget data storage
- Key-value pattern allows flexible data structures
- JSON storage for complex data types
- Automatic cleanup on widget deletion

### API Standardization
- All endpoints use `defineApiHandler`
- Automatic dependency injection
- Consistent error handling
- Performance monitoring built-in
- Zod validation for all inputs

### Testing Philosophy
- E2E tests are mandatory, not optional
- Test the user experience, not implementation
- Use real database operations in tests
- Clean state between test runs
- Playwright for all testing needs