import { useQuery } from '@tanstack/react-query'
import type { Post } from '@/schemas'

export function useQueryAdminPost(postId: string) {
  return useQuery({
    queryKey: ['admin', 'post', postId],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(`/api/posts/${postId}`)
      if (!response.ok) {
        throw new Error('Post not found')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!postId,
  })
}
