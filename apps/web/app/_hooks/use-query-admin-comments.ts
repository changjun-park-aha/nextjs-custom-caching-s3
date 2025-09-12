'use client'

import { useQuery } from '@tanstack/react-query'

export function useQueryAdminComments(enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'comments'],
    // biome-ignore lint/suspicious/useAwait: 구현 필요
    queryFn: async (): Promise<Comment[]> => {
      // For now, we'll return empty array since the API needs modification
      // In a real implementation, you'd have a dedicated admin API
      return Promise.resolve([])
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled,
  })
}
