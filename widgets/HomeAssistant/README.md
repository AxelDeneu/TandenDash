# Home Assistant Widget

A powerful widget for displaying and controlling Home Assistant devices in TandenDash.

## Features

- **Real-time Updates**: WebSocket connection for instant state changes
- **Fallback Support**: Automatic REST API fallback when WebSocket unavailable
- **In-Widget Entity Selection**: Browse and select entities without leaving the widget
- **Favorites & Recent**: Quick access to frequently used entities
- **Multiple View Modes**: Compact, standard, and detailed display options
- **Device Control**: Turn on/off lights, switches, locks, and more
- **Multi-Instance**: Connect to multiple Home Assistant instances

## Architecture

### Adapter Pattern
The widget uses an adapter pattern to separate WebSocket and REST implementations:

```
HomeAssistantService (Facade)
    ├── WebSocketAdapter (Real-time)
    └── RestAdapter (Fallback)
```

### State Management
- **Widget State**: Managed by `useHomeAssistantState` composable
- **Persistent Storage**: Uses `widgetData` API for entity selection, favorites, etc.
- **Connection Pool**: `connectionManager` with WeakMap for automatic cleanup

### Component Structure
```
index.vue (Main widget)
├── EntitySelector.vue (Entity browser)
├── devices/
│   ├── LightDevice.vue
│   ├── SensorDevice.vue
│   ├── SwitchDevice.vue
│   └── ... (other device types)
└── ConnectionError.vue
```

## Configuration

### Connection Settings
- **Instance URL**: Your Home Assistant URL (e.g., `http://homeassistant.local:8123`)
- **Access Token**: Long-lived access token from Home Assistant
- **WebSocket**: Enable/disable real-time updates
- **Reconnect Interval**: Time between reconnection attempts

### Display Settings
- **Show Entity Name**: Display friendly name
- **Show Entity State**: Display current state
- **Show Last Updated**: Display update timestamp
- **Show History**: Display historical data (sensors only)

### Control Settings
- **Allow Control**: Enable device control features
- **Confirm Actions**: Require confirmation for control actions

## Usage

### Initial Setup
1. Add the Home Assistant widget to your dashboard
2. Configure the connection settings with your instance URL and access token
3. The entity selector will open automatically

### Selecting an Entity
1. Click the settings icon in the widget header
2. Browse or search for entities
3. Filter by domain (lights, sensors, switches, etc.)
4. Star entities to add to favorites
5. Click an entity to select it

### Changing View Mode
Use the view mode buttons in the widget header:
- **Compact**: Minimal display with essential info
- **Standard**: Balanced view with state and controls
- **Detailed**: Full information including attributes

## API Endpoints

The widget provides several API endpoints for Home Assistant integration:

- `GET /api/widgets/homeassistant/entities` - List all entities
- `GET /api/widgets/homeassistant/entities/:id` - Get specific entity
- `POST /api/widgets/homeassistant/services` - Call Home Assistant service
- `POST /api/widgets/homeassistant/test` - Test connection

## Development

### Adding a New Device Type
1. Create a new component in `components/devices/`
2. Implement the device-specific UI and controls
3. Add the device type to the switch statement in `index.vue`
4. Add translations for the new device type

### Creating Custom Adapters
Implement the `HomeAssistantAdapter` interface:
```typescript
export interface HomeAssistantAdapter {
  connect(config: ConnectionConfig): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  getEntity(entityId: string): HassEntity | null
  getAllEntities(): Record<string, HassEntity>
  subscribeToEntity(entityId: string, callback: Function): () => void
  callService(service: HassService): Promise<void>
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
  ping(): Promise<boolean>
}
```

### Testing
```bash
# Run E2E tests
npm run test:e2e

# Test specific scenarios
npm run test:e2e -- homeassistant
```

## Troubleshooting

### Connection Issues
- Verify your Home Assistant URL is accessible
- Check that your access token is valid
- Ensure CORS is properly configured if needed
- Try disabling WebSocket to use REST fallback

### Entity Not Updating
- Check WebSocket connection status
- Verify entity exists in Home Assistant
- Try refreshing the entity list
- Check browser console for errors

### Performance Issues
- Reduce history hours for sensor widgets
- Use compact view mode for many widgets
- Enable WebSocket for real-time updates
- Check network latency to Home Assistant

## Security

- Access tokens are stored locally in the browser
- All API calls go through the TandenDash proxy
- No direct browser-to-HA connections (prevents CORS issues)
- Supports Home Assistant's built-in authentication

## License

Part of TandenDash - see main project license