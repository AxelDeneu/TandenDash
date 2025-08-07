import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import {
  WidgetPositionSchema,
  WidgetPositionDBSchema,
  CreateWidgetRequestSchema,
  UpdateWidgetRequestSchema,
  DeleteWidgetRequestSchema,
  CreatePageRequestSchema,
  UpdatePageRequestSchema,
  DeletePageRequestSchema,
  WidgetValidationRegistry,
  widgetValidationRegistry,
  validateWidgetConfig,
  registerWidgetValidationSchema,
  safeParseJson
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('WidgetPositionSchema', () => {
    it('should validate valid widget position', () => {
      const validPosition = {
        x: 10,
        y: 20,
        width: 100,
        height: 150
      }

      const result = WidgetPositionSchema.parse(validPosition)
      expect(result).toEqual(validPosition)
    })

    it('should reject negative coordinates', () => {
      expect(() => WidgetPositionSchema.parse({
        x: -1,
        y: 20,
        width: 100,
        height: 150
      })).toThrow()

      expect(() => WidgetPositionSchema.parse({
        x: 10,
        y: -1,
        width: 100,
        height: 150
      })).toThrow()
    })

    it('should reject zero or negative dimensions', () => {
      expect(() => WidgetPositionSchema.parse({
        x: 10,
        y: 20,
        width: 0,
        height: 150
      })).toThrow()

      expect(() => WidgetPositionSchema.parse({
        x: 10,
        y: 20,
        width: 100,
        height: -1
      })).toThrow()
    })
  })

  describe('WidgetPositionDBSchema', () => {
    it('should validate valid DB position format', () => {
      const validDBPosition = {
        left: '10px',
        top: '20px',
        width: '100px',
        height: '150px'
      }

      const result = WidgetPositionDBSchema.parse(validDBPosition)
      expect(result).toEqual(validDBPosition)
    })

    it('should reject invalid pixel format', () => {
      expect(() => WidgetPositionDBSchema.parse({
        left: '10',
        top: '20px',
        width: '100px',
        height: '150px'
      })).toThrow()

      expect(() => WidgetPositionDBSchema.parse({
        left: '10px',
        top: '20em',
        width: '100px',
        height: '150px'
      })).toThrow()
    })
  })

  describe('CreateWidgetRequestSchema', () => {
    it('should validate valid create widget request', () => {
      const validRequest = {
        type: 'clock',
        position: { x: 10, y: 20, width: 100, height: 150 },
        options: { showSeconds: true },
        pageId: 1
      }

      const result = CreateWidgetRequestSchema.parse(validRequest)
      expect(result).toEqual(validRequest)
    })

    it('should allow optional pageId', () => {
      const requestWithoutPageId = {
        type: 'clock',
        position: { x: 10, y: 20, width: 100, height: 150 },
        options: {}
      }

      const result = CreateWidgetRequestSchema.parse(requestWithoutPageId)
      expect(result.pageId).toBeUndefined()
    })

    it('should reject empty type', () => {
      expect(() => CreateWidgetRequestSchema.parse({
        type: '',
        position: { x: 10, y: 20, width: 100, height: 150 },
        options: {}
      })).toThrow()
    })
  })

  describe('CreatePageRequestSchema', () => {
    it('should validate valid create page request', () => {
      const validRequest = {
        name: 'Test Page',
        snapping: true,
        gridRows: 8,
        gridCols: 12,
        marginTop: 10,
        marginRight: 15,
        marginBottom: 20,
        marginLeft: 25
      }

      const result = CreatePageRequestSchema.parse(validRequest)
      expect(result).toEqual(validRequest)
    })

    it('should validate minimal page request', () => {
      const minimalRequest = { name: 'Test Page' }
      
      const result = CreatePageRequestSchema.parse(minimalRequest)
      expect(result.name).toBe('Test Page')
      expect(result.snapping).toBeUndefined()
    })

    it('should reject empty name', () => {
      expect(() => CreatePageRequestSchema.parse({
        name: ''
      })).toThrow()
    })

    it('should reject invalid grid dimensions', () => {
      expect(() => CreatePageRequestSchema.parse({
        name: 'Test',
        gridRows: 0
      })).toThrow()

      expect(() => CreatePageRequestSchema.parse({
        name: 'Test',
        gridRows: 51
      })).toThrow()
    })

    it('should reject invalid margin values', () => {
      expect(() => CreatePageRequestSchema.parse({
        name: 'Test',
        marginTop: -1
      })).toThrow()

      expect(() => CreatePageRequestSchema.parse({
        name: 'Test',
        marginTop: 201
      })).toThrow()
    })
  })
})

describe('WidgetValidationRegistry', () => {
  let registry: WidgetValidationRegistry

  beforeEach(() => {
    registry = new (WidgetValidationRegistry as any)() // Create fresh instance
    vi.clearAllMocks()
  })

  it('should register and retrieve schemas', () => {
    const schema = z.object({ test: z.string() })
    
    registry.registerSchema('test-widget', schema)
    
    expect(registry.hasSchema('test-widget')).toBe(true)
    expect(registry.getSchema('test-widget')).toBe(schema)
  })

  it('should warn when overwriting existing schema', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
    const schema1 = z.object({ test: z.string() })
    const schema2 = z.object({ test: z.number() })
    
    registry.registerSchema('test-widget', schema1)
    registry.registerSchema('test-widget', schema2)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Validation schema for widget type "test-widget" is already registered. Overwriting...'
    )
    expect(registry.getSchema('test-widget')).toBe(schema2)
    
    consoleSpy.mockRestore()
  })

  it('should unregister schemas', () => {
    const schema = z.object({ test: z.string() })
    
    registry.registerSchema('test-widget', schema)
    expect(registry.hasSchema('test-widget')).toBe(true)
    
    const unregistered = registry.unregisterSchema('test-widget')
    expect(unregistered).toBe(true)
    expect(registry.hasSchema('test-widget')).toBe(false)
    
    const unregisteredAgain = registry.unregisterSchema('test-widget')
    expect(unregisteredAgain).toBe(false)
  })

  it('should get registered types', () => {
    const schema1 = z.object({ test1: z.string() })
    const schema2 = z.object({ test2: z.number() })
    
    registry.registerSchema('widget-1', schema1)
    registry.registerSchema('widget-2', schema2)
    
    const types = registry.getRegisteredTypes()
    expect(types).toContain('widget-1')
    expect(types).toContain('widget-2')
    expect(types).toHaveLength(2)
  })

  it('should validate config successfully', () => {
    const schema = z.object({
      title: z.string(),
      count: z.number().min(0)
    })
    
    registry.registerSchema('test-widget', schema)
    
    const validConfig = { title: 'Test Title', count: 5 }
    const result = registry.validateConfig('test-widget', validConfig)
    
    expect(result).toEqual(validConfig)
  })

  it('should throw error for unregistered widget type', () => {
    expect(() => {
      registry.validateConfig('unregistered-widget', {})
    }).toThrow('No validation schema registered for widget type: unregistered-widget')
  })

  it('should throw formatted error for invalid config', () => {
    const schema = z.object({
      title: z.string(),
      count: z.number().min(0)
    })
    
    registry.registerSchema('test-widget', schema)
    
    expect(() => {
      registry.validateConfig('test-widget', { title: 123, count: -1 })
    }).toThrow(/Widget configuration validation failed for "test-widget"/)
  })

  it('should clear all schemas', () => {
    const schema1 = z.object({ test1: z.string() })
    const schema2 = z.object({ test2: z.number() })
    
    registry.registerSchema('widget-1', schema1)
    registry.registerSchema('widget-2', schema2)
    
    expect(registry.getRegisteredTypes()).toHaveLength(2)
    
    registry.clear()
    
    expect(registry.getRegisteredTypes()).toHaveLength(0)
  })

  it('should get registry status', () => {
    const schema1 = z.object({ test1: z.string() })
    const schema2 = z.object({ test2: z.number() })
    
    registry.registerSchema('widget-1', schema1)
    registry.registerSchema('widget-2', schema2)
    
    const status = registry.getStatus()
    
    expect(status.count).toBe(2)
    expect(status.registeredTypes).toContain('widget-1')
    expect(status.registeredTypes).toContain('widget-2')
  })
})

describe('Helper Functions', () => {
  beforeEach(() => {
    widgetValidationRegistry.clear()
  })

  describe('validateWidgetConfig', () => {
    it('should use the singleton registry', () => {
      const schema = z.object({ test: z.string() })
      widgetValidationRegistry.registerSchema('test-widget', schema)
      
      const result = validateWidgetConfig('test-widget', { test: 'value' })
      expect(result).toEqual({ test: 'value' })
    })
  })

  describe('registerWidgetValidationSchema', () => {
    it('should use the singleton registry', () => {
      const schema = z.object({ test: z.string() })
      
      registerWidgetValidationSchema('test-widget', schema)
      
      expect(widgetValidationRegistry.hasSchema('test-widget')).toBe(true)
    })
  })

  describe('safeParseJson', () => {
    it('should parse valid JSON and validate with schema', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      
      const jsonString = '{"name": "John", "age": 30}'
      const result = safeParseJson(jsonString, schema)
      
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should throw error for invalid JSON', () => {
      const schema = z.object({ test: z.string() })
      
      expect(() => {
        safeParseJson('invalid json', schema)
      }).toThrow('Invalid JSON or schema validation failed')
    })

    it('should throw error for valid JSON that fails schema validation', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })
      
      const jsonString = '{"name": "John", "age": "thirty"}'
      
      expect(() => {
        safeParseJson(jsonString, schema)
      }).toThrow('Invalid JSON or schema validation failed')
    })
  })
})