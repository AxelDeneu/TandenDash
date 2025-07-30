import { z } from 'zod'

export const modeStateSchema = z.object({
  mode: z.enum(['light', 'dark'])
})

export const updateModeStateSchema = z.object({
  mode: z.enum(['light', 'dark'])
})