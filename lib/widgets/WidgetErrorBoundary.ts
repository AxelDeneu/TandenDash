import type { IWidgetErrorBoundary } from './interfaces'

interface ErrorInfo {
  error: Error
  timestamp: Date
  recoveryAttempts: number
  lastRecoveryAttempt?: Date
  stackTrace?: string
}

export class WidgetErrorBoundary implements IWidgetErrorBoundary {
  private errorMap = new Map<string, ErrorInfo>()
  private maxRecoveryAttempts = 3
  private recoveryDelay = 1000 // 1 second

  handleError(error: Error, instanceId: string): void {
    console.error(`Widget error in instance "${instanceId}":`, error)

    const existingError = this.errorMap.get(instanceId)
    
    if (existingError) {
      // Update existing error info
      existingError.error = error
      existingError.timestamp = new Date()
      existingError.stackTrace = error.stack
    } else {
      // Create new error info
      this.errorMap.set(instanceId, {
        error,
        timestamp: new Date(),
        recoveryAttempts: 0,
        stackTrace: error.stack
      })
    }

    // Attempt automatic recovery for certain error types
    this.attemptAutoRecovery(instanceId, error)
  }

  async recoverInstance(instanceId: string): Promise<boolean> {
    const errorInfo = this.errorMap.get(instanceId)
    if (!errorInfo) {
      return false // No error to recover from
    }

    if (errorInfo.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.warn(`Max recovery attempts reached for widget instance "${instanceId}"`)
      return false
    }

    try {
      errorInfo.recoveryAttempts++
      errorInfo.lastRecoveryAttempt = new Date()

      // Wait before attempting recovery
      await new Promise(resolve => setTimeout(resolve, this.recoveryDelay))

      // Recovery logic would be handled by the instance manager
      // This is a placeholder for the recovery attempt
      console.log(`Attempting recovery for widget instance "${instanceId}" (attempt ${errorInfo.recoveryAttempts})`)

      // For now, we'll consider recovery successful and clear the error
      this.clearError(instanceId)
      return true

    } catch (recoveryError) {
      console.error(`Recovery failed for widget instance "${instanceId}":`, recoveryError)
      errorInfo.error = recoveryError as Error
      return false
    }
  }

  getErrorInfo(instanceId: string): ErrorInfo | undefined {
    return this.errorMap.get(instanceId)
  }

  // Additional utility methods
  clearError(instanceId: string): void {
    this.errorMap.delete(instanceId)
  }

  clearAllErrors(): void {
    this.errorMap.clear()
  }

  getErrorCount(): number {
    return this.errorMap.size
  }

  getInstancesWithErrors(): string[] {
    return Array.from(this.errorMap.keys())
  }

  hasError(instanceId: string): boolean {
    return this.errorMap.has(instanceId)
  }

  setMaxRecoveryAttempts(attempts: number): void {
    this.maxRecoveryAttempts = Math.max(0, attempts)
  }

  setRecoveryDelay(delay: number): void {
    this.recoveryDelay = Math.max(0, delay)
  }

  private async attemptAutoRecovery(instanceId: string, error: Error): Promise<void> {
    // Define recoverable error types
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'ConfigurationError'
    ]

    const isRecoverable = recoverableErrors.some(type => 
      error.name === type || error.message.includes(type)
    )

    if (isRecoverable) {
      console.log(`Attempting auto-recovery for recoverable error in instance "${instanceId}"`)
      
      // Delay auto-recovery attempt
      setTimeout(async () => {
        const success = await this.recoverInstance(instanceId)
        if (success) {
          console.log(`Auto-recovery successful for instance "${instanceId}"`)
        } else {
          console.warn(`Auto-recovery failed for instance "${instanceId}"`)
        }
      }, this.recoveryDelay)
    }
  }

  // Error reporting and analytics
  generateErrorReport(): {
    totalErrors: number
    errorsByType: Record<string, number>
    errorsByInstance: Record<string, ErrorInfo>
    recoverySuccess: number
    recoveryFailure: number
  } {
    const errorsByType: Record<string, number> = {}
    const errorsByInstance: Record<string, ErrorInfo> = {}
    let recoverySuccess = 0
    let recoveryFailure = 0

    for (const [instanceId, errorInfo] of this.errorMap) {
      // Count by error type
      const errorType = errorInfo.error.name || 'Unknown'
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1

      // Store error info
      errorsByInstance[instanceId] = errorInfo

      // Count recovery stats
      if (errorInfo.recoveryAttempts > 0) {
        if (errorInfo.recoveryAttempts >= this.maxRecoveryAttempts) {
          recoveryFailure++
        } else {
          recoverySuccess++
        }
      }
    }

    return {
      totalErrors: this.errorMap.size,
      errorsByType,
      errorsByInstance,
      recoverySuccess,
      recoveryFailure
    }
  }
}