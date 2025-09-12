'use client'

import { useQuery } from '@tanstack/react-query'
import type { Comment } from '@/schemas/comments'

export function useQueryComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<Comment[]> => {
      const response = await fetch(`/api/comments?postId=${postId}`)
      if (!response.ok) {
        throw new Error('Failed to load comments')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!postId,
  })
}
