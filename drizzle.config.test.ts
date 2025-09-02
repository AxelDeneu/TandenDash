import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/db.ts',
  dbCredentials: {
    url: './database/test.db'
  }
})