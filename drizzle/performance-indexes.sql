-- Performance optimization migration: Add missing database indexes
-- This migration adds indexes for foreign keys and commonly queried columns

-- Indexes for TodoItem table
CREATE INDEX IF NOT EXISTS "todoItem_todoListId_idx" ON "TodoItem" ("todoListId");
CREATE INDEX IF NOT EXISTS "todoItem_position_idx" ON "TodoItem" ("position");
CREATE INDEX IF NOT EXISTS "todoItem_checked_idx" ON "TodoItem" ("checked");
CREATE INDEX IF NOT EXISTS "todoItem_list_position_idx" ON "TodoItem" ("todoListId", "position");

-- Indexes for WidgetInstance table  
CREATE INDEX IF NOT EXISTS "widgetInstance_pageId_idx" ON "WidgetInstance" ("pageId");
CREATE INDEX IF NOT EXISTS "widgetInstance_type_idx" ON "WidgetInstance" ("type");
CREATE INDEX IF NOT EXISTS "widgetInstance_page_type_idx" ON "WidgetInstance" ("pageId", "type");

-- Add indexes for Pages table for good measure
CREATE INDEX IF NOT EXISTS "pages_name_idx" ON "Pages" ("name");