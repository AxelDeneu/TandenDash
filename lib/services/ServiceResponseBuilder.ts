import type { ServiceResult, ServiceListResult, ILoggerService } from './interfaces'

export class ServiceResponseBuilder {
  constructor(private readonly logger?: ILoggerService) {}

  static success<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data
    }
  }

  static successList<T>(data: T[]): ServiceListResult<T> {
    return {
      success: true,
      data,
      total: data.length
    }
  }

  static error(error: unknown, context: string): ServiceResult<never> {
    return {
      success: false,
      error: error instanceof Error ? error.message : context
    }
  }

  static listError(error: unknown, context: string): ServiceListResult<never> {
    return {
      success: false,
      error: error instanceof Error ? error.message : context
    }
  }

  static notFound(entity: string, id: number | string): ServiceResult<never> {
    return {
      success: false,
      error: `${entity} with id ${id} not found`
    }
  }

  static validationError(message: string): ServiceResult<never> {
    return {
      success: false,
      error: message
    }
  }

  // Instance methods for logging support
  successWithLog<T>(data: T, operation: string, context?: Record<string, unknown>): ServiceResult<T> {
    this.logger?.info(`${operation} succeeded`, context)
    return ServiceResponseBuilder.success(data)
  }

  errorWithLog(error: unknown, operation: string, context?: Record<string, unknown>): ServiceResult<never> {
    this.logger?.error(`${operation} failed`, error, context)
    return ServiceResponseBuilder.error(error, `Failed to ${operation}`)
  }
}