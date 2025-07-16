import { chromium, FullConfig } from '@playwright/test'
import { rm } from 'fs/promises'
import { join } from 'path'
import { setupTestDatabase, cleanupTestDatabase } from './setup/db-setup'

async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting global setup for e2e tests...')
  
  // Nettoyer les résultats de tests précédents
  try {
    await rm(join(process.cwd(), 'test-results'), { recursive: true, force: true })
  } catch (error) {
    // Ignorer si le dossier n'existe pas
  }
  
  // Configurer la base de données de test
  try {
    await setupTestDatabase()
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }
  
  console.log('✅ Global setup completed')
  
  // Retourner une fonction de nettoyage qui sera appelée après tous les tests
  return async () => {
    console.log('🧹 Running global cleanup...')
    
    // Nettoyer la base de données de test
    await cleanupTestDatabase()
    
    console.log('✅ Global cleanup completed')
  }
}

export default globalSetup