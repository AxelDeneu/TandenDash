import { z } from 'zod'
import { defineApiHandler, getValidatedBody } from '@/server/utils/api-handler'
import { createError } from 'h3'

const ProxyRequestSchema = z.object({
  url: z.string().url().startsWith('http')
})

export default defineApiHandler(async ({ event }) => {
  const { url } = await getValidatedBody(event, (body) => ProxyRequestSchema.parse(body))
  
  try {
    // Fetch the iCal data from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TandenDash Calendar Widget'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type') || ''
    
    // Verify it's calendar data
    if (!contentType.includes('calendar') && !contentType.includes('text/plain')) {
      const text = await response.text()
      if (!text.includes('BEGIN:VCALENDAR')) {
        throw new Error('Invalid calendar format')
      }
    }
    
    return await response.text()
  } catch (error) {
    console.error('Calendar proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch calendar data',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
  }
})