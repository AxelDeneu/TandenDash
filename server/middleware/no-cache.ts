export default defineEventHandler((event) => {
  // Only apply no-cache headers to API routes
  if (event.node.req.url?.startsWith('/api/')) {
    setHeaders(event, {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    })
  }
})