import { z, type ZodSchema } from 'zod'
import type { BaseWidgetConfig } from '@/types/widget'
import type { WidgetPluginManifest } from './interfaces'

// Enhanced validation schemas for widget plugins
export const WidgetMetadataSchema = z.object({
  id: z.string()
    .min(1, 'Plugin ID is required')
    .max(50, 'Plugin ID must be 50 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Plugin ID can only contain letters, numbers, hyphens, and underscores'),
  name: z.string()
    .min(1, 'Plugin name is required')
    .max(100, 'Plugin name must be 100 characters or less'),
  description: z.string()
    .min(1, 'Plugin description is required')
    .max(500, 'Plugin description must be 500 characters or less'),
  version: z.string()
    .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/, 'Version must follow semver format (e.g., 1.0.0)'),
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author must be 100 characters or less'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be 50 characters or less'),
  tags: z.array(z.string().max(30, 'Tag must be 30 characters or less'))
    .max(10, 'Maximum 10 tags allowed'),
  icon: z.string()
    .refine(
      (value) => {
        // Check if it's a valid URL
        try {
          new URL(value)
          return true
        } catch {
          // Check if it's an emoji (more comprehensive check including compound emojis)
          // This regex supports most emojis including those with variation selectors and zero-width joiners
          const emojiRegex = /^[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]+$/u
          return emojiRegex.test(value) ||
                 // Allow ASCII symbols
                 /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]$/.test(value) ||
                 // Allow simple text icons
                 /^[a-zA-Z0-9]{1,3}$/.test(value)
        }
      },
      'Icon must be a valid URL or emoji'
    ).optional(),
  preview: z.string().url('Preview must be a valid URL').optional(),
  dependencies: z.array(z.string()).optional(),
  minDashboardVersion: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Minimum dashboard version must follow semver format')
    .optional()
})

export const WidgetSettingsSchema = z.object({
  allowResize: z.boolean().default(true),
  allowMove: z.boolean().default(true),
  allowDelete: z.boolean().default(true),
  allowConfigure: z.boolean().default(true)
})

export const BaseWidgetConfigSchema = z.object({
  minWidth: z.number().min(1, 'Minimum width must be at least 1'),
  minHeight: z.number().min(1, 'Minimum height must be at least 1')
})

export class WidgetValidationSystem {
  private static instance: WidgetValidationSystem
  private validationCache = new Map<string, boolean>()

  static getInstance(): WidgetValidationSystem {
    if (!WidgetValidationSystem.instance) {
      WidgetValidationSystem.instance = new WidgetValidationSystem()
    }
    return WidgetValidationSystem.instance
  }

  validatePluginManifest<TConfig extends BaseWidgetConfig>(
    manifest: WidgetPluginManifest<TConfig>
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate metadata
      WidgetMetadataSchema.parse(manifest.metadata)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `Metadata: ${e.path.join('.')}: ${e.message}`))
      }
    }

    // Validate component
    if (!manifest.component) {
      errors.push('Component is required')
    } else if (typeof manifest.component !== 'object') {
      errors.push('Component must be a valid Vue component')
    }

    // Validate config schema
    if (!manifest.configSchema) {
      errors.push('Config schema is required')
    } else {
      try {
        // Validate that the schema extends BaseWidgetConfig
        const testConfig = manifest.defaultConfig
        BaseWidgetConfigSchema.parse(testConfig)
      } catch (error) {
        errors.push('Config schema must extend BaseWidgetConfig')
      }
    }

    // Validate default config against schema
    if (manifest.configSchema && manifest.defaultConfig) {
      try {
        manifest.configSchema.parse(manifest.defaultConfig)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push('Default config validation failed: ' + 
            error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '))
        }
      }
    }

    // Validate settings
    if (manifest.settings) {
      try {
        WidgetSettingsSchema.parse(manifest.settings)
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(...error.errors.map(e => `Settings: ${e.path.join('.')}: ${e.message}`))
        }
      }
    }

    // Validate permissions
    if (manifest.permissions) {
      const validPermissions = [
        'network', 'storage', 'clipboard', 'notifications', 
        'geolocation', 'camera', 'microphone', 'filesystem'
      ]
      
      for (const permission of manifest.permissions) {
        if (!validPermissions.includes(permission)) {
          warnings.push(`Unknown permission: ${permission}`)
        }
      }
    }

    // Check for potential security issues
    if (manifest.metadata.id.includes('..') || manifest.metadata.id.includes('/')) {
      errors.push('Plugin ID contains invalid path characters')
    }

    // Validate lifecycle hooks if present
    if (manifest.lifecycle) {
      const lifecycleHooks = ['onMount', 'onUnmount', 'onUpdate', 'onResize', 'onConfigChange', 'onError']
      for (const [hook, fn] of Object.entries(manifest.lifecycle)) {
        if (!lifecycleHooks.includes(hook)) {
          warnings.push(`Unknown lifecycle hook: ${hook}`)
        }
        if (typeof fn !== 'function') {
          errors.push(`Lifecycle hook ${hook} must be a function`)
        }
      }
    }

    const isValid = errors.length === 0
    
    // Cache result
    this.validationCache.set(manifest.metadata.id, isValid)

    return { isValid, errors, warnings }
  }

  validateConfig<TConfig extends BaseWidgetConfig>(
    schema: ZodSchema<TConfig>,
    config: unknown
  ): {
    isValid: boolean
    validatedConfig?: TConfig
    errors: string[]
  } {
    try {
      const validatedConfig = schema.parse(config)
      return {
        isValid: true,
        validatedConfig,
        errors: []
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }
      }
      return {
        isValid: false,
        errors: ['Unknown validation error']
      }
    }
  }

  createConfigSchema<TConfig extends BaseWidgetConfig>(
    additionalSchema: z.ZodRawShape
  ): ZodSchema<TConfig> {
    return BaseWidgetConfigSchema.extend(additionalSchema) as ZodSchema<TConfig>
  }

  // Security validation
  validateSecurity(manifest: WidgetPluginManifest): {
    isSecure: boolean
    risks: string[]
    recommendations: string[]
  } {
    const risks: string[] = []
    const recommendations: string[] = []

    // Check for dangerous permissions
    if (manifest.permissions?.includes('filesystem')) {
      risks.push('Widget requests filesystem access')
      recommendations.push('Ensure filesystem access is necessary and properly sandboxed')
    }

    if (manifest.permissions?.includes('network')) {
      risks.push('Widget requests network access')
      recommendations.push('Validate all network requests and use HTTPS where possible')
    }

    // Check for suspicious patterns in metadata
    if (manifest.metadata.description.toLowerCase().includes('eval') ||
        manifest.metadata.description.toLowerCase().includes('script')) {
      risks.push('Widget description mentions potentially dangerous operations')
    }

    // Check version
    if (!manifest.metadata.version.match(/^\d+\.\d+\.\d+$/)) {
      risks.push('Non-standard version format may indicate untrusted source')
    }

    const isSecure = risks.length === 0

    return { isSecure, risks, recommendations }
  }

  // Performance validation
  validatePerformance(manifest: WidgetPluginManifest): {
    score: number // 0-100
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Check default config size
    const configSize = JSON.stringify(manifest.defaultConfig).length
    if (configSize > 10000) { // 10KB
      issues.push('Large default configuration may impact performance')
      suggestions.push('Consider reducing default configuration size')
      score -= 20
    }

    // Check for data provider
    if (manifest.dataProvider) {
      suggestions.push('Ensure data provider implements efficient caching')
    }

    // Check metadata
    if (manifest.metadata.description.length > 200) {
      suggestions.push('Consider shortening description for better UI performance')
      score -= 5
    }

    return { score, issues, suggestions }
  }

  clearCache(): void {
    this.validationCache.clear()
  }

  getCachedValidation(pluginId: string): boolean | undefined {
    return this.validationCache.get(pluginId)
  }
}