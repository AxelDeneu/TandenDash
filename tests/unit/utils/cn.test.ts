import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils/cn'

describe('cn (Class Name Utility)', () => {
  it('should merge basic class names', () => {
    const result = cn('px-2 py-1', 'text-center')
    expect(result).toBe('px-2 py-1 text-center')
  })

  it('should resolve conflicting Tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-3')
    expect(result).toBe('py-1 px-3')
  })

  it('should handle conditional classes', () => {
    const result = cn('text-red-500', true && 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle falsy conditional classes', () => {
    const result = cn('text-red-500', false && 'text-blue-500')
    expect(result).toBe('text-red-500')
  })

  it('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1')
    expect(result).toBe('px-2 py-1')
  })

  it('should handle empty strings', () => {
    const result = cn('px-2', '', 'py-1')
    expect(result).toBe('px-2 py-1')
  })

  it('should handle arrays of class names', () => {
    const result = cn(['px-2', 'py-1'], ['text-center'])
    expect(result).toBe('px-2 py-1 text-center')
  })

  it('should handle objects with boolean values', () => {
    const result = cn({
      'px-2': true,
      'py-1': false,
      'text-center': true
    })
    expect(result).toBe('px-2 text-center')
  })

  it('should handle complex conflict resolution', () => {
    const result = cn(
      'bg-red-500 text-white',
      'bg-blue-500',
      'text-black hover:text-white'
    )
    expect(result).toBe('bg-blue-500 text-black hover:text-white')
  })

  it('should handle responsive and state variants', () => {
    const result = cn(
      'text-sm md:text-lg',
      'hover:text-blue-500 focus:text-red-500'
    )
    expect(result).toBe('text-sm md:text-lg hover:text-blue-500 focus:text-red-500')
  })

  it('should handle margin and padding conflicts', () => {
    const result = cn('m-4 p-2', 'm-6 p-4')
    expect(result).toBe('m-6 p-4')
  })

  it('should handle size conflicts', () => {
    const result = cn('w-4 h-4', 'w-8 h-8')
    expect(result).toBe('w-8 h-8')
  })

  it('should handle no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle complex mixed arguments', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'btn',
      ['px-4', 'py-2'],
      {
        'bg-blue-500': isActive,
        'bg-gray-500': isDisabled,
        'text-white': true
      },
      isActive && 'hover:bg-blue-600',
      !isDisabled && 'cursor-pointer'
    )
    
    expect(result).toBe('btn px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer')
  })

  it('should handle duplicate classes', () => {
    const result = cn('px-4 px-4 py-2 py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('should preserve important modifiers', () => {
    const result = cn('!text-red-500', 'text-blue-500')
    expect(result).toBe('!text-red-500 text-blue-500')
  })
})