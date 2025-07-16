import { existsSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { pages } from '../../../lib/db'

const TEST_DB_PATH = 'test.db'
const MIGRATIONS_PATH = path.join(process.cwd(), 'drizzle')

export async function setupTestDatabase(): Promise<void> {
  console.log('🗄️  Setting up test database...')
  
  try {
    // 1. Remove existing test database if it exists
    if (existsSync(TEST_DB_PATH)) {
      console.log('  → Removing existing test database')
      unlinkSync(TEST_DB_PATH)
    }
    
    // 2. Create new database connection
    console.log('  → Creating new test database')
    const sqlite = new Database(TEST_DB_PATH, {
      verbose: process.env.DEBUG ? console.log : undefined,
      fileMustExist: false,
    })
    
    // 3. Apply optimizations
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('synchronous = NORMAL')
    sqlite.pragma('cache_size = -64000')
    sqlite.pragma('foreign_keys = ON')
    sqlite.pragma('temp_store = MEMORY')
    
    // 4. Initialize Drizzle
    const db = drizzle(sqlite)
    
    // 5. Run migrations
    console.log('  → Running database migrations')
    try {
      migrate(db, { migrationsFolder: MIGRATIONS_PATH })
      console.log('  → Migrations completed successfully')
    } catch (error) {
      console.error('  ❌ Migration failed:', error)
      throw error
    }
    
    // 6. Insert default test data (optional)
    await insertDefaultTestData(db)
    
    // 7. Close the connection
    sqlite.close()
    
    console.log('✅ Test database setup completed')
  } catch (error) {
    console.error('❌ Test database setup failed:', error)
    throw error
  }
}

async function insertDefaultTestData(db: any): Promise<void> {
  console.log('  → Inserting default test data')
  
  try {
    // Insert default pages
    const [testPage] = await db.insert(pages).values({
      name: 'Test Page 1',
      snapping: true,
      gridRows: 12,
      gridCols: 12,
      marginTop: 16,
      marginRight: 16,
      marginBottom: 16,
      marginLeft: 16,
    }).returning()
    
    console.log(`  → Created test page: ${testPage.name}`)
    
    // You can add more test data here as needed
    // For example: test widgets, test todos, etc.
    
  } catch (error) {
    // It's okay if default data insertion fails
    console.warn('  ⚠️  Could not insert default test data:', error)
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  console.log('🧹 Cleaning up test database...')
  
  try {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH)
      console.log('✅ Test database cleaned up')
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error)
  }
}