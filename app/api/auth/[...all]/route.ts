import { createAuthInstance } from '@/lib/auth/database'

/**
 * Multi-tenant auth handler that routes requests to aksiyonsoft auth instances.
 *
 *
 * aksiyonsoft database exists before handling the authentication request.
 */
async function handleAuthRequest(request: Request) {
  try {
    // Handle auth with the single DB instance
    const auth = createAuthInstance()

    // Handle the request with the appropriate auth instance
    return auth.handler(request)
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export { handleAuthRequest as GET, handleAuthRequest as POST }
