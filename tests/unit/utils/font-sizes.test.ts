import { describe, it, expect } from 'vitest'
import { 
  TAILWIND_TO_PIXELS,
  toPixels,
  fontSizeStyle
} from '@/lib/utils/font-sizes'

describe('Font Size Utils', () => {
  describe('TAILWIND_TO_PIXELS', () => {
    it('should contain correct Tailwind to pixel mappings', () => {
      expect(TAILWIND_TO_PIXELS['text-xs']).toBe(12)
      expect(TAILWIND_TO_PIXELS['text-sm']).toBe(14)
      expect(TAILWIND_TO_PIXELS['text-base']).toBe(16)
      expect(TAILWIND_TO_PIXELS['text-lg']).toBe(18)
      expect(TAILWIND_TO_PIXELS['text-xl']).toBe(20)
      expect(TAILWIND_TO_PIXELS['text-2xl']).toBe(24)
      expect(TAILWIND_TO_PIXELS['text-3xl']).toBe(30)
      expect(TAILWIND_TO_PIXELS['text-4xl']).toBe(36)
      expect(TAILWIND_TO_PIXELS['text-5xl']).toBe(48)
      expect(TAILWIND_TO_PIXELS['text-6xl']).toBe(60)
      expect(TAILWIND_TO_PIXELS['text-7xl']).toBe(72)
      expect(TAILWIND_TO_PIXELS['text-8xl']).toBe(96)
      expect(TAILWIND_TO_PIXELS['text-9xl']).toBe(128)
    })
  })

  describe('toPixels', () => {
    it('should return default size for undefined', () => {
      expect(toPixels(undefined)).toBe(16)
    })

    it('should return default size for null', () => {
      expect(toPixels(null as any)).toBe(16)
    })

    it('should return number as-is', () => {
      expect(toPixels(24)).toBe(24)
      expect(toPixels(0)).toBe(0)
      expect(toPixels(100)).toBe(100)
    })

    it('should convert Tailwind classes to pixels', () => {
      expect(toPixels('text-xs')).toBe(12)
      expect(toPixels('text-base')).toBe(16)
      expect(toPixels('text-2xl')).toBe(24)
      expect(toPixels('text-9xl')).toBe(128)
    })

    it('should parse numeric strings', () => {
      expect(toPixels('24')).toBe(24)
      expect(toPixels('16')).toBe(16)
      expect(toPixels('0')).toBe(0)
    })

    it('should parse numeric strings with px suffix', () => {
      expect(toPixels('24px')).toBe(24)
      expect(toPixels('16px')).toBe(16)
      expect(toPixels('100px')).toBe(100)
    })

    it('should return default for invalid Tailwind class', () => {
      expect(toPixels('text-invalid')).toBe(16)
      expect(toPixels('not-a-class')).toBe(16)
    })

    it('should return default for non-numeric strings', () => {
      expect(toPixels('abc')).toBe(16)
      expect(toPixels('text')).toBe(16)
      expect(toPixels('')).toBe(16)
    })

    it('should handle edge cases', () => {
      expect(toPixels('0px')).toBe(0)
      expect(toPixels(' 24 ')).toBe(24) // parseInt handles whitespace
      expect(toPixels('24.5')).toBe(24) // parseInt truncates decimals
    })
  })

  describe('fontSizeStyle', () => {
    it('should return style object with pixels for undefined', () => {
      const style = fontSizeStyle(undefined)
      expect(style).toEqual({ fontSize: '16px' })
    })

    it('should return style object with pixels for number', () => {
      const style = fontSizeStyle(24)
      expect(style).toEqual({ fontSize: '24px' })
    })

    it('should return style object with pixels for Tailwind class', () => {
      const style = fontSizeStyle('text-xl')
      expect(style).toEqual({ fontSize: '20px' })
    })

    it('should return style object with pixels for numeric string', () => {
      const style = fontSizeStyle('32')
      expect(style).toEqual({ fontSize: '32px' })
    })

    it('should return style object with pixels for string with px', () => {
      const style = fontSizeStyle('28px')
      expect(style).toEqual({ fontSize: '28px' })
    })

    it('should return default style for invalid input', () => {
      const style = fontSizeStyle('invalid-class')
      expect(style).toEqual({ fontSize: '16px' })
    })

    it('should handle edge cases', () => {
      expect(fontSizeStyle(0)).toEqual({ fontSize: '0px' })
      expect(fontSizeStyle('text-xs')).toEqual({ fontSize: '12px' })
      expect(fontSizeStyle('text-9xl')).toEqual({ fontSize: '128px' })
    })
  })
})