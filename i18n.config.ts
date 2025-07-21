export default defineI18nConfig(() => ({
  legacy: false,
  locale: process.env.NUXT_DEFAULT_LOCALE || 'en',
  fallbackLocale: 'en',
  messages: {}
}))