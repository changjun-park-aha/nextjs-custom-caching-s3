import { useQuery } from '@tanstack/react-query'
import type { Post } from '@/schemas/posts'

export function useQueryPosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error('Failed to load posts')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
