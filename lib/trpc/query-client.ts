import {
  QueryClient,
  QueryCache,
  MutationCache,
  Query,
  Mutation,
} from '@tanstack/react-query'
import { toast } from 'sonner'

const showError = (
  error: unknown,
  query:
    | Query<unknown, unknown, unknown, readonly unknown[]>
    | Mutation<unknown, unknown, unknown, unknown>,
  defaultMessage = 'Bir hata oluştu'
) => {
  let errorMessage = defaultMessage
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }
  const keys =
    'queryKey' in query ? query.queryKey || [] : query.options.mutationKey || []
  const stringQueryKeys = keys
    .map((key) => {
      // array ise [1,2,3] -> "1,2,3"
      if (Array.isArray(key)) {
        return key.join(',')
      }
      if (typeof key === 'object') return null
      return String(key)
    })
    .filter((key) => !!key)
    .join(', ')
  return toast.error(`[${stringQueryKeys}] ${errorMessage}`, {
    closeButton: true,
    duration: 5000,
  })
}

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        showError(error, query, 'Bir sorgu hatası oluştu')
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        showError(error, mutation, 'Bir işlem hatası oluştu')
        console.error(
          {
            mutation,
            error,
            variables,
            context,
          },
          'Mutation error'
        )
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false, // retry açık olursa her hata için tekrar toast düşebilir
      },
      mutations: {
        retry: false,
      },
    },
  })
