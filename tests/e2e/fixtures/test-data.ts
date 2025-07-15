export const testData = {
  pages: {
    defaultPage: {
      name: 'Dashboard',
      gridRows: 4,
      gridCols: 4,
      enableSnapping: true,
    },
    testPage: {
      name: 'Test Dashboard',
      gridRows: 6,
      gridCols: 6,
      enableSnapping: false,
    },
  },
  
  widgets: {
    clock: {
      name: 'Clock Widget',
      config: {
        title: 'Test Clock',
        showSeconds: true,
        use24Hour: false,
        showDate: true,
        dateFormat: 'full',
        alignment: 'horizontal',
        size: 'medium',
        primaryColor: '#3b82f6',
        backgroundColor: '#f3f4f6',
      },
    },
    
    weather: {
      name: 'Weather Widget',
      config: {
        title: 'Test Weather',
        apiKey: process.env.WEATHER_API_KEY || 'test-api-key',
        location: 'New York',
        units: 'imperial',
        showFeelsLike: true,
        showHumidity: true,
        showWindSpeed: true,
        refreshInterval: 30,
      },
    },
    
    todoList: {
      name: 'Todo List',
      config: {
        title: 'Test Tasks',
        defaultListName: 'My Tasks',
        enableDragDrop: true,
        showCompletedItems: true,
      },
      testItems: [
        { text: 'Test todo item 1', completed: false },
        { text: 'Test todo item 2', completed: true },
        { text: 'Test todo item 3', completed: false },
      ],
    },
  },
  
  positions: {
    topLeft: { x: 0, y: 0 },
    topRight: { x: 3, y: 0 },
    center: { x: 1, y: 1 },
    bottomLeft: { x: 0, y: 3 },
    bottomRight: { x: 3, y: 3 },
  },
  
  sizes: {
    small: { width: 1, height: 1 },
    medium: { width: 2, height: 2 },
    large: { width: 3, height: 3 },
    wide: { width: 4, height: 2 },
    tall: { width: 2, height: 4 },
  },
}