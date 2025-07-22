export default defineNuxtPlugin(async (nuxtApp) => {
  // Importer tous les fichiers index.ts des widgets
  const widgetTranslations = import.meta.glob('/widgets/*/lang/index.ts', { 
    eager: true,
    import: 'default'
  })
  
  // Accéder à l'instance i18n
  const { $i18n } = nuxtApp
  
  if (!$i18n) {
    console.error('[Widget i18n] i18n instance not found!')
    return
  }
  
  // Pour chaque locale configurée
  for (const locale of $i18n.locales.value) {
    const localeCode = typeof locale === 'string' ? locale : locale.code
    
    // Pour chaque widget trouvé
    for (const [path, translations] of Object.entries(widgetTranslations)) {
      const widgetName = path.match(/widgets\/([^/]+)\/lang/)?.[1]?.toLowerCase()
      if (!widgetName) continue
      
      if (translations && translations[localeCode]) {
        // Fusionner les traductions du widget
        const widgetMessages = {
          [`widget_${widgetName}`]: translations[localeCode]
        }
        
        // Utiliser mergeLocaleMessage pour ajouter les traductions
        $i18n.mergeLocaleMessage(localeCode, widgetMessages)
      }
    }
  }
})