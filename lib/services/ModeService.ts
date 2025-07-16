import type { IModeService, ServiceResult, ILoggerService } from './interfaces'
import type { IModeStateRepository } from '@/lib/repositories/interfaces'
import { BaseService } from './BaseService'

export class ModeService extends BaseService implements IModeService {
  protected readonly entityName = 'Mode'
  
  constructor(
    private readonly modeStateRepository: IModeStateRepository,
    logger?: ILoggerService
  ) {
    super(logger)
  }

  async getCurrentMode(): Promise<ServiceResult<'light' | 'dark'>> {
    try {
      this.logOperation('getCurrentMode')
      
      const mode = await this.modeStateRepository.getCurrentMode()
      
      return this.success(mode)
    } catch (error) {
      return this.handleError(error, 'get current mode')
    }
  }

  async setMode(mode: 'light' | 'dark'): Promise<ServiceResult<void>> {
    try {
      this.logOperation('setMode', { mode })
      
      await this.modeStateRepository.setMode(mode)
      
      return this.success(undefined)
    } catch (error) {
      return this.handleError(error, 'set mode')
    }
  }

  async toggleMode(): Promise<ServiceResult<'light' | 'dark'>> {
    try {
      this.logOperation('toggleMode')
      
      const currentMode = await this.modeStateRepository.getCurrentMode()
      const newMode = currentMode === 'dark' ? 'light' : 'dark'
      
      await this.modeStateRepository.setMode(newMode)
      
      this.logger?.info('Mode toggled', { from: currentMode, to: newMode }, {
        module: 'mode',
        method: 'toggleMode'
      })
      
      return this.success(newMode)
    } catch (error) {
      return this.handleError(error, 'toggle mode')
    }
  }
}