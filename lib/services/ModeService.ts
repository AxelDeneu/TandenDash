import type { IModeService, ServiceResult } from './interfaces'
import type { IModeStateRepository } from '@/lib/repositories/interfaces'

export class ModeService implements IModeService {
  constructor(private readonly modeStateRepository: IModeStateRepository) {}

  async getCurrentMode(): Promise<ServiceResult<'light' | 'dark'>> {
    try {
      const mode = await this.modeStateRepository.getCurrentMode()
      
      return {
        success: true,
        data: mode
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current mode'
      }
    }
  }

  async setMode(mode: 'light' | 'dark'): Promise<ServiceResult<void>> {
    try {
      await this.modeStateRepository.setMode(mode)
      
      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set mode'
      }
    }
  }

  async toggleMode(): Promise<ServiceResult<'light' | 'dark'>> {
    try {
      const currentMode = await this.modeStateRepository.getCurrentMode()
      const newMode = currentMode === 'dark' ? 'light' : 'dark'
      
      await this.modeStateRepository.setMode(newMode)
      
      return {
        success: true,
        data: newMode
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle mode'
      }
    }
  }
}