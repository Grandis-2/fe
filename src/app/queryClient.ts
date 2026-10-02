import { QueryClient } from '@tanstack/react-query'

import { defaultQueryOptions } from '@shared/api/queryPolicy'

export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
})
