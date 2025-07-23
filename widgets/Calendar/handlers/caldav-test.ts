import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { CalDAVService } from '../services/CalDAVService'
import type { CalDAVConfig } from '../types'

// Schema de validation pour tester la connexion CalDAV
const CalDAVTestRequestSchema = z.object({
  serverUrl: z.string().url(),
  username: z.string(),
  password: z.string()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Validate request
  const validation = CalDAVTestRequestSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request parameters',
      data: validation.error.errors
    })
  }
  
  const { serverUrl, username, password } = validation.data
  
  try {
    // Initialize CalDAV service
    const caldavConfig: CalDAVConfig = {
      serverUrl,
      username,
      password,
      authMethod: 'basic'
    }
    
    const caldavService = new CalDAVService(caldavConfig)
    
    // Try to discover calendars
    const calendars = await caldavService.discoverCalendars()
    
    if (calendars.length === 0) {
      return {
        success: false,
        message: 'No calendars found for this user',
        calendars: []
      }
    }
    
    return {
      success: true,
      message: `Found ${calendars.length} calendar(s)`,
      calendars: calendars.map(cal => ({
        url: cal.url,
        name: cal.displayName,
        description: cal.description
      }))
    }
    
  } catch (error) {
    console.error('CalDAV test error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('authenticate')) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication failed',
          data: { 
            error: 'Invalid username or password',
            details: error.message
          }
        })
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Connection failed',
          data: { 
            error: 'Could not connect to CalDAV server',
            details: error.message
          }
        })
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Test failed',
        data: { 
          error: error.message,
          details: error.stack
        }
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Test failed',
      data: { error: 'Unknown error occurred' }
    })
  }
})