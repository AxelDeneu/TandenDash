import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge class names with tailwind-merge
 * This ensures that conflicting Tailwind CSS classes are properly resolved
 * 
 * @example
 * cn('px-2 py-1', 'px-3') // Returns 'py-1 px-3'
 * cn('text-red-500', conditional && 'text-blue-500') // Conditionally applies classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}