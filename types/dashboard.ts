// Dashboard entity
export interface Dashboard {
  id: number
  name: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Dashboard settings
export interface DashboardSettings {
  id: number
  dashboardId: number
  locale: string
  measurementSystem: 'metric' | 'imperial'
  temperatureUnit: 'celsius' | 'fahrenheit'
  timeFormat: '24h' | '12h'
  dateFormat: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  createdAt: string
  updatedAt: string
}

// Dashboard with relations
export interface DashboardWithRelations extends Dashboard {
  settings?: DashboardSettings
  pages?: import('./page').Page[]
}

// API request types
export interface CreateDashboardRequest {
  name: string
  isDefault?: boolean
  settings?: Partial<Omit<DashboardSettings, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>>
}

export interface UpdateDashboardRequest {
  id: number
  name?: string
  isDefault?: boolean
}

export interface UpdateDashboardSettingsRequest {
  dashboardId: number
  locale?: string
  measurementSystem?: 'metric' | 'imperial'
  temperatureUnit?: 'celsius' | 'fahrenheit'
  timeFormat?: '24h' | '12h'
  dateFormat?: string
  timezone?: string
  theme?: 'light' | 'dark' | 'auto'
}

export interface DeleteDashboardRequest {
  id: number
}