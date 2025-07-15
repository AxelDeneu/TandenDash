// Database schema definitions - extracted from db.ts
import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Table Definitions ---

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