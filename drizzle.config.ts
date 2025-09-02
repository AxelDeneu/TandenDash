import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'sqlite', // 'mysql' | 'sqlite' | 'turso'
  schema: './lib/db.ts',
  url: './database/dev.db'
})