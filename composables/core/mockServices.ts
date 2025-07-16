import type { IServiceFactory } from '@/lib/services/interfaces'
import type { IWidgetCore } from '@/lib/widgets/interfaces'

// Mock service factory for client-side to avoid database initialization
export function createMockServiceFactory(): IServiceFactory {
  return {
    createWidgetService: () => ({
      async findAll() { return [] },
      async findById() { return null },
      async findByPageId() { return [] },
      async findByType() { return [] },
      async create() { throw new Error('Client-side service calls not supported') },
      async update() { throw new Error('Client-side service calls not supported') },
      async delete() { throw new Error('Client-side service calls not supported') },
      async bulkCreate() { throw new Error('Client-side service calls not supported') },
      async validateConfig() { return { isValid: true, errors: [] } },
      async getPositionConflicts() { return [] }
    }),
    createPageService: () => ({
      async findAll() { return [] },
      async findById() { return null },
      async create() { throw new Error('Client-side service calls not supported') },
      async update() { throw new Error('Client-side service calls not supported') },
      async delete() { throw new Error('Client-side service calls not supported') },
      async getDefaultGridSettings() { return { rows: 6, cols: 6, snapping: true } }
    }),
    createTodoService: () => ({
      async findAllLists() { return [] },
      async findListById() { return null },
      async createList() { throw new Error('Client-side service calls not supported') },
      async updateList() { throw new Error('Client-side service calls not supported') },
      async deleteList() { throw new Error('Client-side service calls not supported') },
      async findItemsByListId() { return [] },
      async findItemById() { return null },
      async createItem() { throw new Error('Client-side service calls not supported') },
      async updateItem() { throw new Error('Client-side service calls not supported') },
      async deleteItem() { throw new Error('Client-side service calls not supported') },
      async batchUpdateItems() { throw new Error('Client-side service calls not supported') }
    }),
    createModeService: () => ({
      async getCurrentMode() { return 'light' },
      async setMode() { throw new Error('Client-side service calls not supported') },
      async toggleMode() { throw new Error('Client-side service calls not supported') }
    })
  } as IServiceFactory
}

// Mock widget system for client-side
export function createMockWidgetSystem(): IWidgetCore {
  return {
    async initialize() {},
    async shutdown() {},
    getSystemInfo() { 
      return { 
        initialized: true, 
        pluginCount: 0, 
        instanceCount: 0,
        errorCount: 0
      } 
    },
    async performHealthCheck() {
      return { healthy: true, issues: [], recommendations: [] }
    },
    register() {},
    unregister() {},
    getPlugin() { return undefined },
    getAllPlugins() { return [] },
    getPluginsByCategory() { return [] },
    searchPlugins() { return [] },
    async createInstance() { return 'mock-id' },
    async destroyInstance() {},
    async updateInstance() {},
    getInstance() { return undefined },
    getAllInstances() { return [] },
    getInstancesByPlugin() { return [] }
  } as IWidgetCore
}