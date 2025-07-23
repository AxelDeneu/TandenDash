import { resolve } from 'path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'shadcn-nuxt', '@nuxtjs/i18n', '~/modules/widget-api'],
  css: ['~/assets/css/main.css'],
  
  // i18n configuration
  i18n: {
    locales: [
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'es', iso: 'es-ES', file: 'es.json', name: 'Español' },
      { code: 'de', iso: 'de-DE', file: 'de.json', name: 'Deutsch' }
    ],
    defaultLocale: process.env.NUXT_DEFAULT_LOCALE || 'en',
    langDir: '../lang/',
    lazy: true,
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts'
  },
  
  // Auto-imports configuration
  imports: {
    dirs: [
      'lib/utils'
    ]
  },
  
  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-only)
    openweatherApiKey: '', // Will be overridden by NUXT_OPENWEATHER_API_KEY env var
    
    // Public configuration (available on client)
    public: {
      // Add any public configuration here
    }
  },

  app: {
    head: {
      title: 'TandenDash',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' }
      ]
    }
  },
  
  // additional config
  vite: {
    resolve: {
      alias: {},
    },
    optimizeDeps: {
      exclude: ['better-sqlite3', 'drizzle-orm/better-sqlite3', 'drizzle-orm'],
      include: ['vue', 'vue-router', '@vueuse/core'] // Pre-bundle common dependencies
    },
    define: {
      global: 'globalThis'
    },
    ssr: {
      noExternal: [],
      external: ['better-sqlite3']
    },
    // Allow resolution of widget node_modules
    server: {
      fs: {
        allow: [
          // Allow access to widget directories
          resolve(process.cwd(), 'widgets'),
        ]
      }
    },
    build: {
      // Optimize bundle size
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2 // Run compression passes twice for better optimization
        }
      },
      // Split chunks by size
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'utils': ['zod', 'clsx', 'tailwind-merge']
          }
        },
        external: ['better-sqlite3', 'drizzle-orm/better-sqlite3']
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Source map generation only in development
      sourcemap: process.env.NODE_ENV === 'development'
    }
  },

  // Server-only imports
  nitro: {
    experimental: {
      wasm: true
    },
    // Optimize server performance
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    prerender: {
      // Prerender static pages
      routes: []
    },
    // Enable HTTP/2 push
    http2Push: true,
    // Ensure database modules stay server-side
    externals: {
      external: ['better-sqlite3', 'drizzle-orm/better-sqlite3']
    }
  },

  // Prevent database imports on client side
  ssr: true,

  // Performance optimizations
  experimental: {
    payloadExtraction: false, // Reduce initial payload size
    renderJsonPayloads: false, // Optimize JSON payload rendering
    viewTransition: true // Enable view transitions API
  },


  compatibilityDate: '2025-04-15'
})