/**
 * Font size utilities for converting between different formats
 */

// Mapping of Tailwind font size classes to pixel values
export const TAILWIND_TO_PIXELS: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
  'text-6xl': 60,
  'text-7xl': 72,
  'text-8xl': 96,
  'text-9xl': 128
}


/**
 * Convert a font size value to pixels
 * Supports both Tailwind classes and numeric values
 */
export function toPixels(value: string | number | undefined): number {
  if (value === undefined || value === null) {
    return 16 // Default to base size
  }

  // If it's already a number, return it
  if (typeof value === 'number') {
    return value
  }

  // If it's a Tailwind class, convert it
  if (typeof value === 'string' && TAILWIND_TO_PIXELS[value]) {
    return TAILWIND_TO_PIXELS[value]
  }

  // Try to parse as number (e.g., "24" or "24px")
  const parsed = parseInt(value)
  if (!isNaN(parsed)) {
    return parsed
  }

  // Default fallback
  return 16
}

/**
 * Generate a font size style object
 */
export function fontSizeStyle(value: string | number | undefined): { fontSize: string } {
  const pixels = toPixels(value)
  return { fontSize: `${pixels}px` }
}


