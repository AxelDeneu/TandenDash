import type { IWidgetDataRepository } from '@/lib/repositories/interfaces'
import type { ServiceResult, ServiceListResult } from './interfaces'
import type { WidgetData, CreateWidgetDataRequest, UpdateWidgetDataRequest } from '@/lib/repositories/WidgetDataRepository'

export class WidgetDataService {
  constructor(
    private widgetDataRepository: IWidgetDataRepository
  ) {}

  async getAllData(widgetInstanceId: number): ServiceListResult<WidgetData> {
    try {
      const data = await this.widgetDataRepository.findByWidgetInstanceId(widgetInstanceId)
      return {
        success: true,
        data,
        count: data.length
      }
    } catch (error) {
      console.error('Failed to fetch widget data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widget data',
        data: [],
        count: 0
      }
    }
  }

  async getData(widgetInstanceId: number, key: string): ServiceResult<WidgetData | null> {
    try {
      const data = await this.widgetDataRepository.findByKey(widgetInstanceId, key)
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`Failed to fetch widget data for key ${key}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widget data',
        data: null
      }
    }
  }

  async getValue<T = any>(widgetInstanceId: number, key: string): ServiceResult<T | null> {
    try {
      const data = await this.widgetDataRepository.findByKey(widgetInstanceId, key)
      if (!data) {
        return {
          success: true,
          data: null
        }
      }

      try {
        const value = JSON.parse(data.value) as T
        return {
          success: true,
          data: value
        }
      } catch (parseError) {
        // If parsing fails, return the raw string
        return {
          success: true,
          data: data.value as T
        }
      }
    } catch (error) {
      console.error(`Failed to get value for key ${key}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get value',
        data: null
      }
    }
  }

  async setData(widgetInstanceId: number, key: string, value: any): ServiceResult<WidgetData> {
    try {
      // Convert value to JSON string if it's not already a string
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)

      const request: CreateWidgetDataRequest = {
        widgetInstanceId,
        key,
        value: jsonValue
      }

      const data = await this.widgetDataRepository.upsert(request)
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`Failed to set widget data for key ${key}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set widget data',
        data: undefined
      }
    }
  }

  async updateData(widgetInstanceId: number, key: string, value: any): ServiceResult<WidgetData> {
    try {
      // Convert value to JSON string if it's not already a string
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)

      const updateRequest: UpdateWidgetDataRequest = {
        value: jsonValue
      }

      const data = await this.widgetDataRepository.update(widgetInstanceId, key, updateRequest)
      return {
        success: true,
        data
      }
    } catch (error) {
      console.error(`Failed to update widget data for key ${key}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update widget data',
        data: undefined
      }
    }
  }

  async deleteData(widgetInstanceId: number, key: string): ServiceResult<boolean> {
    try {
      const result = await this.widgetDataRepository.delete(widgetInstanceId, key)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error(`Failed to delete widget data for key ${key}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete widget data',
        data: false
      }
    }
  }

  async deleteAllData(widgetInstanceId: number): ServiceResult<boolean> {
    try {
      const result = await this.widgetDataRepository.deleteAll(widgetInstanceId)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error(`Failed to delete all widget data:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete all widget data',
        data: false
      }
    }
  }

  // Batch operations for performance
  async setMultiple(widgetInstanceId: number, data: Record<string, any>): ServiceResult<WidgetData[]> {
    try {
      const results: WidgetData[] = []
      
      for (const [key, value] of Object.entries(data)) {
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)
        const request: CreateWidgetDataRequest = {
          widgetInstanceId,
          key,
          value: jsonValue
        }
        const result = await this.widgetDataRepository.upsert(request)
        results.push(result)
      }

      return {
        success: true,
        data: results
      }
    } catch (error) {
      console.error('Failed to set multiple widget data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set multiple widget data',
        data: []
      }
    }
  }

  async getMultiple<T = Record<string, any>>(widgetInstanceId: number, keys: string[]): ServiceResult<T> {
    try {
      const result: Record<string, any> = {}
      
      for (const key of keys) {
        const data = await this.widgetDataRepository.findByKey(widgetInstanceId, key)
        if (data) {
          try {
            result[key] = JSON.parse(data.value)
          } catch {
            result[key] = data.value
          }
        }
      }

      return {
        success: true,
        data: result as T
      }
    } catch (error) {
      console.error('Failed to get multiple widget data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get multiple widget data',
        data: {} as T
      }
    }
  }
}