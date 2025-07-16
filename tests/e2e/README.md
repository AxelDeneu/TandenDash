# Tests E2E avec Playwright

## Structure

```
tests/e2e/
├── fixtures/          # Fixtures réutilisables Playwright
├── helpers/           # Fonctions utilitaires pour les tests
│   ├── console-helper.ts  # Gestion des erreurs console
│   └── db-helper.ts       # Gestion de la base de données de test
├── setup/            # Scripts de configuration
│   └── db-setup.ts   # Initialisation de la base de données
├── specs/            # Les fichiers de tests
│   └── smoke/        # Tests de fumée (smoke tests)
└── global-setup.ts   # Configuration globale
```

## Configuration de la base de données de test

Les tests utilisent une base de données SQLite séparée (`test.db`) qui est automatiquement :
- Créée avant l'exécution des tests
- Initialisée avec les migrations Drizzle
- Pré-remplie avec des données de test basiques
- Nettoyée après l'exécution des tests

### Variables d'environnement

Les tests utilisent le fichier `.env.test` qui définit :
- `NODE_ENV=test`
- `DATABASE_URL=test.db`
- `PORT=3001` (pour éviter les conflits avec le serveur de développement)

## Exécution des tests

```bash
# Installer Playwright et ses navigateurs
npm run test:install

# Exécuter tous les tests
npm run test:e2e

# Exécuter les tests en mode UI (recommandé pour le développement)
npm run test:e2e:ui

# Exécuter les tests avec navigateur visible
npm run test:e2e:headed

# Déboguer les tests
npm run test:e2e:debug

# Exécuter un test spécifique
npx playwright test tests/e2e/specs/smoke/basic-load.spec.ts

# Exécuter avec un projet spécifique (chromium, firefox, webkit, mobile-chrome, mobile-safari)
npx playwright test --project=chromium

# Nettoyer la base de données de test et les résultats
npm run test:e2e:clean

# Réinitialiser la base de données de test
npm run test:e2e:db:reset
```

## Tests disponibles

### Tests de fumée (Smoke tests)

- **basic-load.spec.ts** : Test de chargement basique de l'application
  - Vérifie que l'application se charge
  - Vérifie l'absence d'erreurs JavaScript critiques (ignore les erreurs 429)

- **app-loads.spec.ts** : Test de chargement complet
  - Vérifie le chargement sans erreurs console
  - Vérifie la présence des éléments UI de base

- **app-loads-with-helper.spec.ts** : Test avec helper de console
  - Utilise le helper console pour une meilleure gestion des erreurs
  - Vérifie l'initialisation du système de widgets

- **db-test.spec.ts** : Test d'intégration avec la base de données
  - Vérifie le chargement avec des données de test
  - Teste l'affichage des widgets depuis la base de données

## Helpers

### console-helper.ts

Fournit des utilitaires pour capturer et analyser les erreurs console :
- `setupConsoleErrorCapture(page)` : Configure la capture des erreurs
- `ignoreKnownErrors(errors)` : Filtre les erreurs connues et acceptables

### db-helper.ts

Fournit des utilitaires pour gérer la base de données dans les tests :
- `getTestDatabase()` : Obtenir une connexion à la base de données de test
- `resetDatabase()` : Réinitialiser la base de données
- `insertTestPages(count)` : Insérer des pages de test
- `insertTestWidget(pageId, type, position)` : Insérer un widget de test
- `getPageWidgets(pageId)` : Récupérer les widgets d'une page
- `cleanupTestData(options)` : Nettoyer des données spécifiques

## Notes importantes

1. **Rate limiting** : Le serveur de développement Nuxt peut retourner des erreurs 429. Les tests sont configurés pour ignorer ces erreurs.

2. **Mode strict** : Playwright utilise le mode strict par défaut. Utilisez `.first()`, `.last()` ou des sélecteurs plus spécifiques pour éviter les erreurs.

3. **Temps d'attente** : Certains tests utilisent `waitForTimeout` au lieu de `waitForLoadState` pour s'assurer que l'application Vue est complètement chargée.

## Prochaines étapes

- Ajouter des tests pour la navigation entre pages
- Ajouter des tests pour l'ajout/suppression de widgets
- Ajouter des tests pour le mode édition
- Ajouter des tests pour le floating dock
- Ajouter des tests de persistance des données