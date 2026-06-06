/**
 * Next.js Instrumentation Hook
 *
 * This file runs once when the Next.js server starts.
 * Used to initialize background services like job scheduler.
 *
 * Note: Uses dynamic import to prevent Edge Runtime from trying to load Node.js-only modules.
 */

type GlobalInstrumentationState = {
  schedulerStarted?: boolean
  shutdownHandlersAttached?: boolean
}

const globalInstrumentation = globalThis as typeof globalThis & {
  __aksiyonInstrumentation?: GlobalInstrumentationState
}

function getInstrumentationState(): GlobalInstrumentationState {
  if (!globalInstrumentation.__aksiyonInstrumentation) {
    globalInstrumentation.__aksiyonInstrumentation = {}
  }
  return globalInstrumentation.__aksiyonInstrumentation
}

export async function register() {
  // Only run on Node.js runtime (not Edge)
  // Check runtime before importing to prevent Edge Runtime errors
  if (process.env.NEXT_RUNTIME === 'nodejs' && typeof window === 'undefined') {
    try {
      const state = getInstrumentationState()
      if (state.schedulerStarted) {
        return
      }

      // Dynamic import to prevent Edge Runtime from loading Node.js modules
      const { startJobScheduler, stopJobScheduler } = await import('@/lib/jobs')

      console.log('[Instrumentation] Starting job scheduler...')
      startJobScheduler()
      console.log('[Instrumentation] Job scheduler started successfully')
      state.schedulerStarted = true

      // Graceful shutdown handling
      const shutdown = () => {
        console.log('[Instrumentation] Shutting down job scheduler...')
        try {
          stopJobScheduler()
          console.log('[Instrumentation] Job scheduler stopped')
        } catch (error) {
          console.error(
            '[Instrumentation] Error stopping job scheduler:',
            error
          )
        }
      }

      if (!state.shutdownHandlersAttached) {
        process.once('SIGTERM', shutdown)
        process.once('SIGINT', shutdown)
        state.shutdownHandlersAttached = true
      }
    } catch (error) {
      console.error('[Instrumentation] Failed to start job scheduler:', error)
      // Don't throw - allow server to continue starting
    }
  }
}
