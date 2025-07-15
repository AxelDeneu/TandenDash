// Dependency Injection Container
import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory'
import { ServiceFactory } from '@/lib/services/ServiceFactory'
import type { IRepositoryFactory } from '@/lib/repositories/interfaces'
import type { IServiceFactory } from '@/lib/services/interfaces'

class DIContainer {
  private static instance: DIContainer
  private repositoryFactory: IRepositoryFactory
  private serviceFactory: IServiceFactory

  private constructor() {
    this.repositoryFactory = new RepositoryFactory()
    this.serviceFactory = new ServiceFactory(this.repositoryFactory)
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer()
    }
    return DIContainer.instance
  }

  getRepositoryFactory(): IRepositoryFactory {
    return this.repositoryFactory
  }

  getServiceFactory(): IServiceFactory {
    return this.serviceFactory
  }

  // For testing - allows injection of mock factories
  setRepositoryFactory(factory: IRepositoryFactory): void {
    this.repositoryFactory = factory
    this.serviceFactory = new ServiceFactory(this.repositoryFactory)
  }

  setServiceFactory(factory: IServiceFactory): void {
    this.serviceFactory = factory
  }
}

export const container = DIContainer.getInstance()