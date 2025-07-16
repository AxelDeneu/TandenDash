import type { ServiceResult, ServiceListResult, ILoggerService } from './interfaces'

export abstract class BaseService {
  protected abstract readonly entityName: string
  
  constructor(protected readonly logger?: ILoggerService) {}

  protected handleError(error: unknown, operation: string): ServiceResult<never> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation} ${this.entityName}`
    
    this.logger?.error(`${this.entityName} ${operation} failed`, error, {
      module: this.entityName.toLowerCase(),
      method: operation
    })
    
    return {
      success: false,
      error: errorMessage
    }
  }

  protected handleListError(error: unknown, operation: string): ServiceListResult<never> {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation} ${this.entityName}`
    
    this.logger?.error(`${this.entityName} ${operation} failed`, error, {
      module: this.entityName.toLowerCase(),
      method: operation
    })
    
    return {
      success: false,
      error: errorMessage
    }
  }

  protected success<T>(data: T): ServiceResult<T> {
    return {
      success: true,
      data
    }
  }

  protected successList<T>(data: T[]): ServiceListResult<T> {
    return {
      success: true,
      data,
      total: data.length
    }
  }

  protected notFound(id: number | string): ServiceResult<never> {
    const error = `${this.entityName} with id ${id} not found`
    
    this.logger?.warn(error, { id }, {
      module: this.entityName.toLowerCase(),
      method: 'notFound'
    })
    
    return {
      success: false,
      error
    }
  }

  protected logOperation(operation: string, data?: unknown): void {
    this.logger?.debug(`${this.entityName} ${operation}`, data, {
      module: this.entityName.toLowerCase(),
      method: operation
    })
  }
}