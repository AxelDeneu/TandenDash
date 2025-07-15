# Guide de développement de widgets pour TandenDash

Ce guide vous explique comment créer facilement un nouveau widget pour TandenDash en utilisant le système de plugins extensible.

## Architecture du système de widgets

TandenDash utilise une architecture de plugins moderne avec :
- **WidgetPluginManifest** : Interface complète pour définir un plugin
- **Validation automatique** : Métadonnées, configuration, et sécurité
- **Lifecycle hooks** : Gestion du cycle de vie (mount, unmount, update, etc.)
- **Error boundaries** : Isolation et récupération automatique des erreurs
- **Data providers** : Fournisseurs de données avec abonnements temps réel

## Créer un nouveau widget : Exemple "Note"

### 1. Structure des fichiers

Créez cette structure pour votre widget :

```
components/widgets/Note/
├── index.vue          # Composant Vue principal
├── definition.ts      # Types et configuration par défaut
└── animations.ts      # Animations optionnelles

lib/widgets/plugins/
└── NoteWidgetPlugin.ts   # Définition du plugin
```

### 2. Définir les types et la configuration

**`components/widgets/Note/definition.ts`**

```typescript
import type { BaseWidgetConfig } from '@/types/widget'

export interface NoteWidgetConfig extends BaseWidgetConfig {
  content: string
  fontSize: string
  textColor: string
  backgroundColor: string
  padding: string
  borderRadius: string
  showBorder: boolean
  borderColor: string
}

export const noteWidgetOptions: Required<NoteWidgetConfig> = {
  content: 'Votre note ici...',
  fontSize: 'text-base',
  textColor: 'text-gray-800',
  backgroundColor: 'bg-yellow-100',
  padding: 'p-4',
  borderRadius: 'rounded-lg',
  showBorder: true,
  borderColor: 'border-yellow-300',
  minWidth: 250,
  minHeight: 150,
}
```

### 3. Créer le composant Vue

**`components/widgets/Note/index.vue`**

```vue
<template>
  <div 
    class="h-full w-full flex items-center justify-center"
    :class="[
      backgroundColor,
      padding,
      borderRadius,
      showBorder ? `border-2 ${borderColor}` : ''
    ]"
  >
    <div 
      v-if="content"
      :class="[fontSize, textColor]"
      class="text-center whitespace-pre-wrap"
    >
      {{ content }}
    </div>
    <div v-else class="text-gray-400 italic">
      Cliquez sur "Edit" pour ajouter une note
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NoteWidgetConfig } from './definition'

const props = defineProps<NoteWidgetConfig>()
</script>
```

### 4. Ajouter la validation

**`lib/validation.ts`** (ajouter à la fin)

```typescript
export const NoteWidgetConfigSchema = z.object({
  content: z.string(),
  fontSize: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),
  padding: z.string(),
  borderRadius: z.string(),
  showBorder: z.boolean(),
  borderColor: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

// Ajouter dans la fonction validateWidgetConfig
case 'note':
  return NoteWidgetConfigSchema.parse(config)
```

### 5. Créer le plugin

**`lib/widgets/plugins/NoteWidgetPlugin.ts`**

```typescript
import type { WidgetPluginManifest } from '../interfaces'
import type { NoteWidgetConfig } from '@/components/widgets/Note/definition'
import { NoteWidgetConfigSchema } from '@/lib/validation'
import NoteComponent from '@/components/widgets/Note/index.vue'
import { noteWidgetOptions } from '@/components/widgets/Note/definition'

export const NoteWidgetPlugin: WidgetPluginManifest<NoteWidgetConfig> = {
  metadata: {
    id: 'note',
    name: 'Note Widget',
    description: 'Un widget simple pour afficher des notes de texte personnalisables',
    version: '1.0.0',
    author: 'Votre nom',
    category: 'Productivity',
    tags: ['note', 'text', 'memo', 'productivity'],
    icon: '📝',  // Emoji ou URL d'image
    dependencies: [],
    minDashboardVersion: '1.0.0'
  },
  configSchema: NoteWidgetConfigSchema,
  defaultConfig: noteWidgetOptions,
  component: NoteComponent,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  lifecycle: {
    onMount: async () => {
      console.log('Note widget mounted')
    },
    onUnmount: async () => {
      console.log('Note widget unmounted')
    },
    onConfigChange: async (newConfig) => {
      console.log('Note widget config changed:', newConfig)
    },
    onError: async (error) => {
      console.error('Note widget error:', error)
    }
  }
}
```

### 6. Enregistrer le plugin

**`lib/widgets/WidgetSystem.ts`** (ajouter l'import et l'enregistrement)

```typescript
// Ajouter l'import
import { NoteWidgetPlugin } from './plugins/NoteWidgetPlugin'

// Dans la méthode registerBuiltInPlugins, ajouter :
await this.registry.registerPlugin(NoteWidgetPlugin)
```

## Fonctionnalités avancées

### Data Provider (optionnel)

Pour les widgets qui ont besoin de données externes :

```typescript
class NoteDataProvider implements IWidgetDataProvider<string> {
  async fetch(): Promise<string> {
    // Récupérer des données depuis une API
    return 'Données depuis l\'API'
  }

  subscribe(callback: (data: string) => void): () => void {
    // S'abonner aux mises à jour en temps réel
    const interval = setInterval(() => {
      this.fetch().then(callback)
    }, 30000)
    
    return () => clearInterval(interval)
  }
}

// Dans le plugin :
dataProvider: NoteDataProvider
```

### Permissions

Spécifiez les permissions requises :

```typescript
permissions: ['network', 'storage', 'geolocation']
```

### Hooks de cycle de vie complets

```typescript
lifecycle: {
  onMount: async (config) => {
    // Widget monté
  },
  onUnmount: async () => {
    // Nettoyage avant démontage
  },
  onUpdate: async (oldConfig, newConfig) => {
    // Configuration mise à jour
  },
  onResize: async (width, height) => {
    // Widget redimensionné
  },
  onConfigChange: async (newConfig) => {
    // Configuration changée via UI
  },
  onError: async (error) => {
    // Erreur dans le widget
  }
}
```

## Test et debugging

1. **Redémarrez le serveur** après avoir ajouté un nouveau plugin
2. **Vérifiez la console** pour les erreurs de validation
3. **Utilisez l'interface** pour ajouter et configurer votre widget
4. **Testez les différentes configurations** via le formulaire d'options

## Bonnes pratiques

1. **Types stricts** : Utilisez TypeScript pour tous les types
2. **Validation robuste** : Définissez des schémas Zod complets
3. **Error handling** : Gérez les erreurs gracieusement
4. **Performance** : Évitez les re-renders inutiles
5. **Accessibilité** : Suivez les standards d'accessibilité web
6. **Responsive** : Testez sur différentes tailles d'écran

## Identifiants de test

Pour tester l'authentification :
- **Admin** : username: `admin` / password: `admin123`
- **User** : username: `user` / password: `user123`

Votre widget sera maintenant disponible dans l'interface d'ajout de widgets et pourra être configuré, déplacé, et redimensionné comme tous les autres widgets du système !