import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '@/lib/db'
import path from 'path'

let testDb: Database.Database | null = null
let testDrizzle: BetterSQLite3Database<typeof schema> | null = null

/**
 * Setup in-memory SQLite database for testing
 */
export async function setupDatabase() {
  if (testDb) {
    return testDrizzle!
  }

  // Create in-memory database
  testDb = new Database(':memory:')
  testDb.pragma('journal_mode = WAL')
  testDb.pragma('foreign_keys = ON')
  
  testDrizzle = drizzle(testDb, { schema })
  
  // Run migrations
  try {
    migrate(testDrizzle, { 
      migrationsFolder: path.join(process.cwd(), 'drizzle') 
    })
  } catch (error) {
    console.warn('Migration warning (expected in test environment):', error)
  }
  
  return testDrizzle
}

/**
 * Get the test database instance
 */
export function getTestDb(): BetterSQLite3Database<typeof schema> {
  if (!testDrizzle) {
    throw new Error('Test database not initialized. Call setupDatabase() first.')
  }
  return testDrizzle
}

/**
 * Clean up database between tests
 */
export async function cleanupDatabase() {
  if (!testDrizzle) return
  
  try {
    // Delete all data from tables in reverse dependency order
    await testDrizzle.delete(schema.widgetData)
    await testDrizzle.delete(schema.widgetInstance)
    await testDrizzle.delete(schema.todoItem)
    await testDrizzle.delete(schema.todoList)
    await testDrizzle.delete(schema.pages)
    await testDrizzle.delete(schema.dashboardSettings)
    await testDrizzle.delete(schema.dashboards)
    await testDrizzle.delete(schema.modeState)
  } catch (error) {
    console.warn('Database cleanup warning:', error)
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (testDb) {
    testDb.close()
    testDb = null
    testDrizzle = null
  }
}

/**
 * Create a test dashboard with optional settings
 */
export async function createTestDashboard(name = 'Test Dashboard', isDefault = true, withSettings = false) {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [dashboard] = await db.insert(schema.dashboards)
    .values({
      name,
      isDefault,
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  // Create default settings only if requested
  if (withSettings) {
    await db.insert(schema.dashboardSettings)
      .values({
        dashboardId: dashboard.id,
        locale: 'en',
        measurementSystem: 'metric',
        temperatureUnit: 'celsius',
        timeFormat: '24h',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'UTC',
        theme: 'light',
        createdAt: now,
        updatedAt: now
      })
  }
  
  return dashboard
}

/**
 * Create a test page
 */
export async function createTestPage(dashboardId: number, name = 'Test Page') {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [page] = await db.insert(schema.pages)
    .values({
      name,
      dashboardId,
      snapping: true,
      gridRows: 10,
      gridCols: 12,
      marginTop: 16,
      marginRight: 16,
      marginBottom: 16,
      marginLeft: 16,
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  return page
}

/**
 * Create a test widget instance
 */
export async function createTestWidget(pageId: number, type = 'Clock') {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [widget] = await db.insert(schema.widgetInstance)
    .values({
      type,
      position: JSON.stringify({ left: '0px', top: '0px', width: '4px', height: '3px' }),
      options: JSON.stringify({ title: 'Test Widget' }),
      pageId,
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  return widget
}

/**
 * Create test widget data
 */
export async function createTestWidgetData(widgetInstanceId: number, key: string, value: any) {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [widgetData] = await db.insert(schema.widgetData)
    .values({
      widgetInstanceId,
      key,
      value: JSON.stringify(value),
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  return widgetData
}

/**
 * Create test todo list with items
 */
export async function createTestTodoList(name = 'Test List') {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [todoList] = await db.insert(schema.todoList)
    .values({
      name,
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  return todoList
}

/**
 * Create test todo item
 */
export async function createTestTodoItem(listId: number, text = 'Test Item', position = 0) {
  const db = getTestDb()
  const now = new Date().toISOString()
  const [todoItem] = await db.insert(schema.todoItem)
    .values({
      listId,
      text,
      completed: false,
      position,
      createdAt: now,
      updatedAt: now
    })
    .returning()
  
  return todoItem
}