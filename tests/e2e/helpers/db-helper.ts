import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { pages, widgetInstance, todoItem, todoList, modeState } from '../../../lib/db'
import path from 'path'

const TEST_DB_PATH = 'test.db'

export interface TestDatabase {
  sqlite: Database.Database
  db: ReturnType<typeof drizzle>
}

/**
 * Get a connection to the test database
 */
export function getTestDatabase(): TestDatabase {
  const sqlite = new Database(TEST_DB_PATH, {
    verbose: process.env.DEBUG ? console.log : undefined,
    fileMustExist: true,
  })
  
  const db = drizzle(sqlite)
  
  return { sqlite, db }
}

/**
 * Reset the database to a clean state
 * Useful for tests that need a fresh database
 */
export async function resetDatabase(): Promise<void> {
  const { sqlite, db } = getTestDatabase()
  
  try {
    // Clear all data from tables
    await db.delete(widgetInstance)
    await db.delete(todoItem)
    await db.delete(todoList)
    await db.delete(pages)
    await db.delete(modeState)
    
    // Reset autoincrement counters
    sqlite.exec("DELETE FROM sqlite_sequence")
    
    console.log('Database reset completed')
  } catch (error) {
    console.error('Failed to reset database:', error)
    throw error
  } finally {
    sqlite.close()
  }
}

/**
 * Insert test pages
 */
export async function insertTestPages(count: number = 3): Promise<any[]> {
  const { sqlite, db } = getTestDatabase()
  
  try {
    const testPages = []
    for (let i = 1; i <= count; i++) {
      const [page] = await db.insert(pages).values({
        name: `Test Page ${i}`,
        snapping: true,
        gridRows: 12,
        gridCols: 12,
        marginTop: 16,
        marginRight: 16,
        marginBottom: 16,
        marginLeft: 16,
      }).returning()
      
      testPages.push(page)
    }
    
    return testPages
  } finally {
    sqlite.close()
  }
}

/**
 * Insert test widgets
 */
export async function insertTestWidget(pageId: number, type: string, position?: any): Promise<any> {
  const { sqlite, db } = getTestDatabase()
  
  try {
    const defaultPosition = position || {
      left: '100px',
      top: '100px',
      width: '300px',
      height: '200px'
    }
    
    const [widget] = await db.insert(widgetInstance).values({
      type,
      pageId,
      position: JSON.stringify(defaultPosition),
      options: JSON.stringify({}),
    }).returning()
    
    return widget
  } finally {
    sqlite.close()
  }
}

/**
 * Get all widgets for a page
 */
export async function getPageWidgets(pageId: number): Promise<any[]> {
  const { sqlite, db } = getTestDatabase()
  
  try {
    const widgets = await db
      .select()
      .from(widgetInstance)
      .where(eq(widgetInstance.pageId, pageId))
    
    return widgets
  } finally {
    sqlite.close()
  }
}

/**
 * Clean up specific test data
 */
export async function cleanupTestData(options: {
  widgets?: boolean
  pages?: boolean
  todos?: boolean
} = {}): Promise<void> {
  const { sqlite, db } = getTestDatabase()
  
  try {
    if (options.widgets) {
      await db.delete(widgetInstance)
    }
    
    if (options.todos) {
      await db.delete(todoItem)
      await db.delete(todoList)
    }
    
    if (options.pages) {
      await db.delete(pages)
    }
  } finally {
    sqlite.close()
  }
}