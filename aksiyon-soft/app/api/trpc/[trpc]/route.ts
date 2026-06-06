import { createTRPCContext } from '@/lib/trpc'
import { appRouter } from '@/lib/trpc/router'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

// Set max duration to 30 minutes (1800 seconds) for long-running operations like Excel import
export const maxDuration = 1800 // 30 minutes in seconds

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
