import { z } from 'zod'

// Widget validation schemas
export const WidgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1)
})

export const WidgetPositionDBSchema = z.object({
  left: z.string().regex(/^\d+px$/),
  top: z.string().regex(/^\d+px$/),
  width: z.string().regex(/^\d+px$/),
  height: z.string().regex(/^\d+px$/)
})

export const CreateWidgetRequestSchema = z.object({
  type: z.string().min(1),
  position: WidgetPositionSchema,
  options: z.record(z.unknown()),
  pageId: z.number().int().positive().optional()
})

export const UpdateWidgetRequestSchema = z.object({
  id: z.number().int().positive(),
  position: WidgetPositionSchema.optional(),
  options: z.record(z.unknown()).optional(),
  pageId: z.number().int().positive().optional()
})

export const DeleteWidgetRequestSchema = z.object({
  id: z.number().int().positive()
})

// Page validation schemas
export const CreatePageRequestSchema = z.object({
  name: z.string().min(1).max(255),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(50).optional(),
  gridCols: z.number().int().min(1).max(50).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const UpdatePageRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  snapping: z.boolean().optional(),
  gridRows: z.number().int().min(1).max(50).optional(),
  gridCols: z.number().int().min(1).max(50).optional(),
  marginTop: z.number().int().min(0).max(200).optional(),
  marginRight: z.number().int().min(0).max(200).optional(),
  marginBottom: z.number().int().min(0).max(200).optional(),
  marginLeft: z.number().int().min(0).max(200).optional()
})

export const DeletePageRequestSchema = z.object({
  id: z.number().int().positive()
})

// Todo validation schemas
export const CreateTodoListRequestSchema = z.object({
  name: z.string().min(1).max(255)
})

export const UpdateTodoListRequestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional()
})

export const CreateTodoItemRequestSchema = z.object({
  content: z.string().min(1).max(1000),
  todoListId: z.number().int().positive(),
  position: z.number().int().min(0).optional(),
  category: z.string().max(100).optional()
})

export const UpdateTodoItemRequestSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1).max(1000).optional(),
  checked: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  category: z.string().max(100).optional()
})

export const BatchUpdateTodoItemsRequestSchema = z.object({
  items: z.array(z.object({
    id: z.number().int().positive(),
    position: z.number().int().min(0).optional(),
    checked: z.boolean().optional()
  })).min(1)
})

// Widget-specific config schemas
export const ClockWidgetConfigSchema = z.object({
  showSeconds: z.boolean(),
  format: z.enum(['12', '24']),
  showDate: z.boolean(),
  hourSize: z.union([z.string(), z.number()]),
  minuteSize: z.union([z.string(), z.number()]),
  secondSize: z.union([z.string(), z.number()]),
  alignment: z.enum(['vertical', 'horizontal']),
  separator: z.string(),
  animateSeparator: z.boolean(),
  hourColor: z.string(),
  minuteColor: z.string(),
  secondColor: z.string(),
  backgroundColor: z.string(),
  separatorSize: z.union([z.string(), z.number()]),
  dateSpacing: z.string(),
  secondsAnimation: z.enum(['bounce', 'spin', 'fade']),
  animateSeconds: z.boolean(),
  timeSeparatorSpacing: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

export const WeatherWidgetConfigSchema = z.object({
  showTemperature: z.boolean(),
  showCondition: z.boolean(),
  showIcon: z.boolean(),
  showLocation: z.boolean(),
  temperatureSize: z.union([z.string(), z.number()]),
  locationSize: z.union([z.string(), z.number()]),
  conditionSize: z.union([z.string(), z.number()]),
  iconSize: z.string(),
  location: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

export const CalendarWidgetConfigSchema = z.object({
  showWeekNumbers: z.boolean(),
  firstDayOfWeek: z.enum(['sunday', 'monday']),
  highlightToday: z.boolean(),
  todayColor: z.string(),
  weekendColor: z.string(),
  fontSize: z.number().min(10).max(24),
  compactMode: z.boolean(),
  showMonthYear: z.boolean(),
  navigationButtons: z.boolean(),
  backgroundColor: z.string(),
  textColor: z.string(),
  borderColor: z.string(),
  headerColor: z.string(),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

export const NoteWidgetConfigSchema = z.object({
  content: z.string(),
  fontSize: z.number().min(10).max(32),
  fontFamily: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),
  padding: z.number().min(0).max(48),
  borderRadius: z.number().min(0).max(24),
  showBorder: z.boolean(),
  borderColor: z.string(),
  borderWidth: z.number().min(0).max(8),
  textAlign: z.enum(['left', 'center', 'right', 'justify']),
  enableMarkdown: z.boolean(),
  shadowStyle: z.enum(['none', 'sm', 'md', 'lg', 'xl']),
  lineHeight: z.number().min(1).max(3),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

export const TimerWidgetConfigSchema = z.object({
  defaultDuration: z.number().min(1).max(86400), // 1 second to 24 hours
  showHours: z.boolean(),
  showMilliseconds: z.boolean(),
  fontSize: z.number().min(16).max(72),
  timerColor: z.string(),
  buttonColor: z.string(),
  backgroundColor: z.string(),
  borderRadius: z.number().min(0).max(32),
  showBorder: z.boolean(),
  borderColor: z.string(),
  enableSound: z.boolean(),
  soundVolume: z.number().min(0).max(1),
  autoRepeat: z.boolean(),
  showProgressBar: z.boolean(),
  progressBarColor: z.string(),
  progressBarHeight: z.number().min(1).max(20),
  minWidth: z.number().min(1),
  minHeight: z.number().min(1)
})

// Validation helper functions
export function validateWidgetConfig(type: string, config: unknown) {
  switch (type) {
    case 'clock':
      return ClockWidgetConfigSchema.parse(config)
    case 'weather':
      return WeatherWidgetConfigSchema.parse(config)
    case 'calendar':
      return CalendarWidgetConfigSchema.parse(config)
    case 'note':
      return NoteWidgetConfigSchema.parse(config)
    case 'timer':
      return TimerWidgetConfigSchema.parse(config)
    default:
      throw new Error(`Unknown widget type: ${type}`)
  }
}

export function safeParseJson<T>(jsonString: string, schema: z.ZodSchema<T>): T {
  try {
    const parsed = JSON.parse(jsonString)
    return schema.parse(parsed)
  } catch (error) {
    throw new Error(`Invalid JSON or schema validation failed: ${error}`)
  }
}