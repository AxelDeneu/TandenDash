import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// --- Database Schema Definitions ---

export const todoList = sqliteTable('TodoList', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

export const todoItem = sqliteTable('TodoItem', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(), // Database uses 'content' field name
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
  todoListId: integer('todoListId').notNull().references(() => todoList.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  category: text('category'),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  // Performance indexes for foreign keys and commonly queried columns
  todoListIdIdx: index('todoItem_todoListId_idx').on(table.todoListId),
  positionIdx: index('todoItem_position_idx').on(table.position),
  checkedIdx: index('todoItem_checked_idx').on(table.checked),
  // Composite index for common query patterns (list + position ordering)
  listPositionIdx: index('todoItem_list_position_idx').on(table.todoListId, table.position),
}));

export const modeState = sqliteTable('ModeState', {
  id: integer('id').primaryKey(),
  mode: text('mode').notNull(),
});

export const widgetInstance = sqliteTable('WidgetInstance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // widget name/slug
  position: text('position').notNull(), // JSON string: {x, y, w, h}
  options: text('options').notNull(), // JSON string for widget config
  pageId: integer('pageId').references(() => pages.id), // nullable, references Pages
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
  // Optionally: userId, pageId, etc.
}, (table) => ({
  // Performance indexes for foreign keys and commonly queried columns
  pageIdIdx: index('widgetInstance_pageId_idx').on(table.pageId),
  typeIdx: index('widgetInstance_type_idx').on(table.type),
  // Composite index for common query patterns (page + type filtering)
  pageTypeIdx: index('widgetInstance_page_type_idx').on(table.pageId, table.type),
}));

export const pages = sqliteTable('Pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  snapping: integer('snapping', { mode: 'boolean' }).notNull().default(false),
  gridRows: integer('gridRows').notNull().default(6),
  gridCols: integer('gridCols').notNull().default(6),
  marginTop: integer('marginTop').notNull().default(0),
  marginRight: integer('marginRight').notNull().default(0),
  marginBottom: integer('marginBottom').notNull().default(0),
  marginLeft: integer('marginLeft').notNull().default(0),
  createdAt: text('createdAt').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updatedAt').notNull().default(sql`(datetime('now'))`),
});

// Database configuration
const getDatabasePath = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  if (isTest) {
    return 'data.test.db'
  }
  
  return 'data.db'
}

// Database connection with optimization
class DatabaseManager {
  private static instance: DatabaseManager
  private database: Database.Database
  private db: ReturnType<typeof drizzle>

  private constructor() {
    const dbPath = getDatabasePath()
    
    try {
      this.database = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        fileMustExist: false,
        timeout: 10000,
      })
      
      // Apply PRAGMA settings for optimization
      this.database.pragma('journal_mode = WAL')
      this.database.pragma('synchronous = NORMAL')
      this.database.pragma('cache_size = -64000')
      this.database.pragma('foreign_keys = ON')
      this.database.pragma('temp_store = MEMORY')
      
      // Force WAL checkpoint to ensure changes are visible
      this.database.pragma('wal_checkpoint(PASSIVE)')

      // Initialize Drizzle
      this.db = drizzle(this.database)

      // Run migrations on startup
      this.runMigrations()

      console.log(`Database initialized: ${dbPath}`)
      
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  public getDb() {
    return this.db
  }

  private runMigrations() {
    try {
      const migrationsPath = path.join(process.cwd(), 'drizzle')
      migrate(this.db, { migrationsFolder: migrationsPath })
      console.log('Database migrations completed')
    } catch (error) {
      console.warn('Migration warning:', error)
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = this.database.prepare('SELECT 1 as health').get() as { health: number } | undefined
      return result?.health === 1
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  public getStats() {
    try {
      const stats = {
        journalMode: this.database.pragma('journal_mode', { simple: true }),
        cacheSize: this.database.pragma('cache_size', { simple: true }),
        pageCount: this.database.pragma('page_count', { simple: true }),
        pageSize: this.database.pragma('page_size', { simple: true }),
      }
      return stats
    } catch (error) {
      console.error('Failed to get database stats:', error)
      return null
    }
  }
  
  public checkpoint() {
    try {
      // Force a WAL checkpoint to ensure all changes are written to the main database file
      this.database.pragma('wal_checkpoint(RESTART)')
      console.log('Database checkpoint completed')
    } catch (error) {
      console.error('Failed to checkpoint database:', error)
    }
  }

  public close() {
    try {
      this.database.close()
      console.log('Database connection closed')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }
}

// Create database instance
const dbManager = DatabaseManager.getInstance()

// Export the database instance
export const db = dbManager.getDb()

// Export utility functions
export const checkDatabaseHealth = () => dbManager.healthCheck()
export const getDatabaseStats = () => dbManager.getStats()
export const checkpointDatabase = () => dbManager.checkpoint()

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('exit', () => dbManager.close())
  process.on('SIGINT', () => {
    dbManager.close()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    dbManager.close()
    process.exit(0)
  })
}