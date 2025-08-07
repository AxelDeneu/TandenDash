import { describe, it, expect } from 'vitest'
import { getTestDb } from './helpers/db-helper'

describe('Test Setup', () => {
  it('should have access to test database', () => {
    const db = getTestDb()
    expect(db).toBeDefined()
  })

  it('should be able to run basic queries', async () => {
    const db = getTestDb()
    const result = await db.run('SELECT 1 as test')
    expect(result).toBeDefined()
  })
})