import { eq } from 'drizzle-orm'
import { db, modeState } from '@/lib/db'
import type { IModeStateRepository } from './interfaces'

export class ModeStateRepository implements IModeStateRepository {
  private readonly MODE_STATE_ID = 1

  async getCurrentMode(): Promise<'light' | 'dark'> {
    const results = await db.select().from(modeState).where(eq(modeState.id, this.MODE_STATE_ID))
    const state = results[0]
    
    if (!state) {
      // Initialize with default light mode
      await this.setMode('light')
      return 'light'
    }
    
    return state.mode === 'dark' ? 'dark' : 'light'
  }

  async setMode(mode: 'light' | 'dark'): Promise<void> {
    const existing = await db.select().from(modeState).where(eq(modeState.id, this.MODE_STATE_ID))
    
    if (existing.length > 0) {
      // Update existing
      await db.update(modeState)
        .set({ mode })
        .where(eq(modeState.id, this.MODE_STATE_ID))
    } else {
      // Insert new
      await db.insert(modeState).values({
        id: this.MODE_STATE_ID,
        mode
      })
    }
  }
}