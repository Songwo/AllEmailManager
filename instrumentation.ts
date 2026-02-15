export async function register() {
  // Only run in the Node.js server runtime (not during build or in Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { listenerManager } = await import('./lib/listener-manager')

    console.log('[Instrumentation] Server starting, auto-starting email listeners...')

    // Start all active listeners with a small delay to let the server fully initialize
    setTimeout(async () => {
      try {
        await listenerManager.startAll()
        console.log('[Instrumentation] Email listeners auto-started successfully')
      } catch (error) {
        console.error('[Instrumentation] Failed to auto-start email listeners:', error)
      }
    }, 3000)
  }
}
