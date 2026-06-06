'use client'

import type { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createTRPCClient, httpBatchStreamLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import SuperJSON from 'superjson'

import { createQueryClient } from './query-client'
import { AppRouter } from './router'

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient())
  }
}

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          // Remove maxURLLength to allow tRPC to use POST for large payloads
          // Previously was 2083 which caused issues with large productStockCardIds arrays
          fetch(url, options) {
            // Create AbortController for timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => {
              controller.abort()
            }, 1800000) // 30 minutes

            // Clear timeout if request completes
            const originalSignal = options?.signal
            if (originalSignal) {
              originalSignal.addEventListener('abort', () => {
                clearTimeout(timeoutId)
              })
            }

            return fetch(url, {
              ...options,
              credentials: 'include',
              signal: controller.signal,
            }).finally(() => {
              clearTimeout(timeoutId)
            })
          },
          headers() {
            const headers = new Headers()
            headers.set('x-trpc-source', 'nextjs-react')

            return headers
          },
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}
