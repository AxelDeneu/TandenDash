# TandenDash

> Modern open-source dashboard for large touch displays

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/tandendash)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/yourusername/tandendash/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)](https://www.typescriptlang.org/)

**TandenDash** is a customizable dashboard application designed for large touch displays. Built as a modern, open-source alternative to MagicMirror² and Dakboard, it brings touch-first interactions and extensible architecture to digital signage and smart home displays.

![TandenDash Demo](https://via.placeholder.com/800x400?text=TandenDash+Dashboard+Screenshot)

## 🚀 Quick Start

Get TandenDash running on your touch display in minutes:

```bash
git clone https://github.com/yourusername/tandendash.git
cd tandendash
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your touch display and start customizing!

**Perfect for:** 24" Touch Displays • Digital Signage • Smart Home Hubs • Information Displays

## ✨ Why TandenDash?

### The Problem with Existing Solutions

**MagicMirror²**: Powerful but complex configuration, limited touch support, requires technical expertise for customization.

**Dakboard**: Great interface but subscription-based, limited widget customization, closed ecosystem.

**Other Solutions**: Built for mouse/keyboard, poor touch experience, or overly complex for simple dashboard needs.

### The TandenDash Solution

A modern, **touch-first dashboard** that combines the best of both worlds:

- 🎯 **Touch-Optimized Interface** - Designed for finger interaction on large displays
- 🔓 **Open Source & Free** - No subscriptions, full control over your display
- 🧩 **Extensible Widget System** - Easy plugin development with TypeScript
- ⚡ **Modern Architecture** - Built with Vue 3, TypeScript, and SOLID principles
- 🎨 **Adaptive Design** - Clean interface that works in any lighting condition

## 🎨 Features

### 🖱️ **Touch-First Interface**
- **Intuitive gestures** optimized for large touch displays
- **Triple-tap center** to toggle dark/light mode instantly
- **Drag and drop** widgets with smooth animations
- **Touch-friendly sizing** with appropriate hit targets

### 🧩 **Powerful Widget System**
- **Built-in widgets**: Clock, Weather, Calendar, Notes, Timer
- **Plugin architecture** for easy custom widget development
- **Live configuration** without restarting the application
- **Error isolation** - widget failures don't crash the system

### 📐 **Smart Layout Management**
- **Grid-based positioning** with optional snapping
- **Multi-page support** for organizing different widget sets
- **Configurable margins** to accommodate display bezels
- **Responsive design** adapts to different display sizes

### 💾 **Persistent & Reliable**
- **SQLite database** for configuration storage
- **SOLID architecture** ensures maintainable codebase
- **Type-safe development** with strict TypeScript
- **Comprehensive testing** with end-to-end coverage

## 📦 Installation & Setup

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Touch display** (24" recommended, works with various sizes)
- **SQLite support** (included in most systems)

### Quick Development Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/tandendash.git
cd tandendash

# Install dependencies
npm install

# Setup database
npx drizzle-kit generate
npx drizzle-kit migrate

# Start development server
npm run dev
```

### Production Deployment

For wall-mounted displays or dedicated hardware:

```bash
# Build optimized version
npm run build

# Preview production build
npm run preview

# For production deployment
npm run build && npm start
```

### Touch Display Configuration

**Recommended Setup:**
- **Display Size**: 24" or larger for optimal touch experience
- **Resolution**: 1920x1080 minimum for best widget clarity
- **Mounting**: Wall-mounted or kiosk-style for dedicated use
- **Hardware**: Raspberry Pi 4+ or dedicated mini PC

### Environment Configuration

Create a `.env` file for customization:

```env
# Database location
DATABASE_URL=./data.db

# Server configuration
NITRO_PORT=3000
NODE_ENV=production

# Widget API keys (optional)
WEATHER_API_KEY=your_key_here
```

## 📖 Usage Examples

### Setting Up Your First Dashboard

1. **Access the Interface** - Navigate to the dashboard on your touch display
2. **Enter Edit Mode** - Tap the edit button in the bottom toolbar
3. **Add Widgets** - Tap the "+" button and select from available widgets
4. **Configure** - Tap any widget to customize its appearance and behavior
5. **Arrange** - Drag widgets to position them, resize by pulling corners
6. **Save** - Exit edit mode to save your layout

### Creating Custom Widgets

TandenDash's plugin system makes custom widgets straightforward:

```typescript
// widgets/MyDisplay/plugin.ts
export const MyDisplayPlugin: WidgetPlugin = {
  id: 'my-display',
  name: 'Custom Display',
  description: 'Shows custom information',
  component: MyDisplayComponent,
  defaultConfig: {
    title: 'My Information',
    updateInterval: 60000
  },
  configSchema: MyDisplayConfigSchema,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  }
}
```

### Common Deployment Scenarios

**🏠 Smart Home Hub**
```bash
# Wall-mounted display showing weather, calendar, and home automation controls
# Ideal for kitchen or entryway mounting
```

**🏢 Office Information Display**
```bash
# Lobby or meeting room display with schedules, announcements, and company info
# Perfect for corporate environments
```

**🏪 Digital Signage**
```bash
# Retail or public space information display
# Customer-facing information and interactive content
```

## 🔌 Widget Ecosystem

### Built-in Widgets

| Widget | Description | Key Features |
|--------|-------------|--------------|
| 🕐 **Clock** | Digital timepiece | 12/24hr formats, timezone support, custom styling, animations |
| 🌤️ **Weather** | Weather conditions | Location-based, temperature, conditions, weather icons |
| 📅 **Calendar** | Date display | Touch-friendly navigation, event display, month/year views |
| 📝 **Note** | Text display | Markdown support, custom fonts, styling, text alignment |
| ⏲️ **Timer** | Countdown timer | Custom intervals, visual alerts, multiple timer support |

### Widget Development

Building custom widgets is designed to be developer-friendly:

1. **Follow the Guide**: [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
2. **Use TypeScript**: Full type safety and IntelliSense support
3. **Leverage the Architecture**: Built-in validation, error handling, and lifecycle management

**Widget Features:**
- Configuration UI generation
- Error boundaries and recovery
- State persistence
- Responsive design helpers

## 🏗️ Architecture & Development

### Built With Modern Technology

- **Frontend**: [Nuxt 3](https://nuxt.com/) + [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Shadcn Vue](https://www.shadcn-vue.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://sqlite.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Animations**: [GSAP](https://greensock.com/gsap/) for smooth transitions
- **Testing**: [Playwright](https://playwright.dev/) for end-to-end testing

### Project Architecture

```
TandenDash/
├── 📁 components/      # Vue components
│   ├── 🧩 widgets/    # Widget-related components
│   ├── 🎨 ui/         # Reusable UI components  
│   └── 📊 dashboard/  # Dashboard-specific components
├── 📁 composables/     # Vue composables (state & logic)
├── 📁 lib/            # Business logic (SOLID architecture)
│   ├── repositories/  # Data access layer
│   ├── services/      # Business logic services
│   └── widgets/       # Widget system core
├── 📁 server/         # Nitro server & API endpoints
├── 📁 widgets/        # Widget plugin definitions
└── 📁 types/          # TypeScript type definitions
```

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npx drizzle-kit generate # Generate database migrations
npx drizzle-kit migrate  # Run migrations
npx drizzle-kit studio   # Visual database management

# Testing
npm run test:e2e         # End-to-end tests
npm run test:e2e:ui      # E2E tests with Playwright UI
npm run test:e2e:smoke   # Quick smoke tests
npm run test:e2e:widgets # Widget-specific tests
```

### Code Quality Standards

- **TypeScript Strict Mode** - No `any` types, full type safety
- **SOLID Principles** - Clean, maintainable architecture
- **Repository Pattern** - Clean separation of data access
- **Dependency Injection** - Testable, modular design
- **Comprehensive Testing** - E2E coverage for critical paths

## 🆚 Comparison

### vs MagicMirror²

| Feature | TandenDash | MagicMirror² |
|---------|------------|--------------|
| **Touch Interface** | ✅ Native touch support | ⚠️ Limited touch support |
| **Configuration** | ✅ Visual UI configuration | ❌ Text file configuration |
| **Widget Development** | ✅ TypeScript + modern tools | ⚠️ JavaScript + older patterns |
| **Architecture** | ✅ SOLID principles, testable | ⚠️ Monolithic structure |
| **Database** | ✅ SQLite with ORM | ❌ File-based storage |

### vs Dakboard

| Feature | TandenDash | Dakboard |
|---------|------------|-----------|
| **Cost** | ✅ Free & open source | ❌ Subscription required |
| **Customization** | ✅ Full source code access | ⚠️ Limited customization |
| **Hosting** | ✅ Self-hosted | ❌ Cloud-only |
| **Widget Development** | ✅ Open plugin system | ❌ No custom widgets |
| **Data Privacy** | ✅ Your data stays local | ⚠️ Cloud-based data |

## 🤝 Community & Support

### Contributing

We welcome contributions! Here's how to get involved:

1. **🍴 Fork** the repository
2. **🌟 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **✨ Implement** your changes (follow our TypeScript standards)
4. **✅ Test** your changes (`npm run test:e2e`)
5. **📝 Commit** with clear messages (`git commit -m 'Add amazing feature'`)
6. **🚀 Push** to your branch (`git push origin feature/amazing-feature`)
7. **📥 Open** a Pull Request

### Getting Help

- 🐛 **Found a bug?** [Open an issue](https://github.com/yourusername/tandendash/issues)
- 💡 **Have a feature idea?** [Start a discussion](https://github.com/yourusername/tandendash/discussions)
- 📖 **Need documentation?** Check our [guides](./docs/)
- 🔧 **Widget development?** See [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)

### Roadmap

**🔜 Near Term:**
- Widget marketplace for community plugins
- Improved touch gesture support
- Mobile configuration companion app
- Enhanced theming system

**🎯 Future Vision:**
- Multi-display synchronization
- Advanced animation system
- Voice control integration
- IoT device integration
- Performance analytics dashboard

## 📄 License & Acknowledgments

### License

MIT License - see [LICENSE](./LICENSE) for details.

### Built on Excellent Foundations

TandenDash leverages outstanding open-source projects:

- 🚀 **[Nuxt 3](https://nuxt.com/)** - The intuitive Vue framework
- 🎨 **[Shadcn Vue](https://www.shadcn-vue.com/)** - Beautiful, accessible components
- 🗄️ **[Drizzle](https://orm.drizzle.team/)** - Type-safe database toolkit
- ✨ **[GSAP](https://greensock.com/gsap/)** - Professional animation library
- 🎯 **[Lucide](https://lucide.dev/)** - Beautiful, consistent icons

### Inspiration & Thanks

- **MagicMirror²** community for pioneering smart mirror concepts
- **Dakboard** for demonstrating excellent dashboard UX
- **Vue.js** ecosystem for providing amazing development tools
- **Touch display** manufacturers for making large displays accessible

---

**Ready to transform your display?** [Get started now](#-quick-start) • [View examples](./docs/examples/) • [Create widgets](./PLUGIN_DEVELOPMENT.md)

<div align="center">
  <a href="#tandendash">⬆️ Back to top</a>
</div>