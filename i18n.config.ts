export default defineI18nConfig(() => ({
  locale: process.env.NUXT_DEFAULT_LOCALE || 'en',
  fallbackLocale: 'en',
  messages: {}
}))