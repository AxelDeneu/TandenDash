import type { WidgetPlugin as IWidgetPlugin } from '@/lib/widgets/WidgetCore'
import type { WidgetConfig } from './definition'
import { WidgetConfigSchema, widgetDefaults, widgetConfig } from './definition'
import HomeAssistantComponent from './index.vue'
import apiRoutes from './api'
import * as langEn from './lang/en.json'
import * as langFr from './lang/fr.json'

export const WIDGET_ID = 'homeassistant'

export const WidgetPlugin: IWidgetPlugin<WidgetConfig> = {
  id: WIDGET_ID,
  name: 'Home Assistant',
  description: 'Display and control Home Assistant devices directly in your dashboard',
  version: '1.0.0',
  icon: '🏠',
  category: 'home-automation',
  tags: ['home-assistant', 'smart-home', 'iot', 'automation', 'devices'],
  component: HomeAssistantComponent,
  defaultConfig: widgetDefaults,
  configSchema: WidgetConfigSchema,
  configUI: widgetConfig as any,
  settings: {
    allowResize: true,
    allowMove: true,
    allowDelete: true,
    allowConfigure: true
  },
  permissions: ['network'],
  apiRoutes
}

export default WidgetPlugin