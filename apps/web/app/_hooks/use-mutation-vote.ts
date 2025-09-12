'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMutationVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      targetId,
      targetType,
      voteType,
    }: {
      targetId: string
      targetType: 'post' | 'comment'
      voteType: 'upvote' | 'downvote'
    }) => {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          targetType,
          voteType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }
      return response.json()
    },
    onSuccess: (_, { targetType }) => {
      // Invalidate relevant queries based on target type
      if (targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: ['posts'] })
        queryClient.invalidateQueries({ queryKey: ['post'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments'] })
      }
    },
  })
}
