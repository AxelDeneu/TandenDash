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

// Reverse mapping for backward compatibility
export const PIXELS_TO_TAILWIND: Record<number, string> = Object.entries(TAILWIND_TO_PIXELS).reduce(
  (acc, [className, pixels]) => ({ ...acc, [pixels]: className }),
  {}
)

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

/**
 * Create a combined style object with font size and other properties
 */
export function createTextStyle(options: {
  size?: string | number
  weight?: string | number
  color?: string
  lineHeight?: string | number
  letterSpacing?: string | number
}): Record<string, string | number> {
  const style: Record<string, string | number> = {}

  if (options.size !== undefined) {
    style.fontSize = `${toPixels(options.size)}px`
  }

  if (options.weight !== undefined) {
    style.fontWeight = options.weight
  }

  if (options.color !== undefined) {
    style.color = options.color
  }

  if (options.lineHeight !== undefined) {
    style.lineHeight = typeof options.lineHeight === 'number' 
      ? options.lineHeight 
      : options.lineHeight
  }

  if (options.letterSpacing !== undefined) {
    style.letterSpacing = typeof options.letterSpacing === 'number'
      ? `${options.letterSpacing}px`
      : options.letterSpacing
  }

  return style
}

/**
 * Get a user-friendly label for a font size
 */
export function getFontSizeLabel(pixels: number): string {
  const labels: Record<number, string> = {
    12: 'Extra Small',
    14: 'Small',
    16: 'Medium',
    18: 'Large',
    20: 'Extra Large',
    24: '2X Large',
    30: '3X Large',
    36: '4X Large',
    48: '5X Large',
    60: '6X Large',
    72: '7X Large',
    96: '8X Large'
  }

  // Find closest match
  const closest = Object.keys(labels)
    .map(Number)
    .reduce((prev, curr) => 
      Math.abs(curr - pixels) < Math.abs(prev - pixels) ? curr : prev
    )

  return labels[closest] || `${pixels}px`
}