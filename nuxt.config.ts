import { resolve } from 'path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', 'shadcn-nuxt', '@nuxtjs/i18n', '~/modules/widget-api', '~/modules/widget-schemas'],
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
      exclude: ['ws']
    },
    // Allow resolution of widget node_modules
    server: {
      fs: {
        allow: [
          // Allow access to widget directories
          resolve(process.cwd(), 'widgets'),
        ]
      },
      allowedHosts: ['localhost', '127.0.0.1', '[::1]', 'tandendash.test']
    }
  },

  compatibilityDate: '2025-04-15',
  
  // Nitro configuration for server-side externals
  nitro: {
    experimental: {
      wasm: true
    },
    externals: {
      external: ['ws']
    }
  }
})