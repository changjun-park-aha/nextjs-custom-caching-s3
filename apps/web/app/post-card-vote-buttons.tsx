'use client'

import { Button } from '@workspace/ui/components/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMutationVote } from '@/app/_hooks/use-mutation-vote'
import { useAuth } from '@/lib/auth-context'
import type { Post } from '@/schemas'

interface PostCardVoteButtonsProps {
  post: Post
}

export function PostCardVoteButtons({ post }: PostCardVoteButtonsProps) {
  const { session } = useAuth()
  const voteMutation = useMutationVote()

  const handleVote = (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!session) {
      return
    }

    voteMutation.mutate({
      targetId: postId,
      targetType: 'post',
      voteType,
    })
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(post.id, 'upvote')}
        className="h-8 w-8 p-1"
        disabled={!session}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className="font-medium text-green-600 text-sm">{post.upvotes}</span>
      <span className="font-medium text-red-600 text-sm">{post.downvotes}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(post.id, 'downvote')}
        className="h-8 w-8 p-1"
        disabled={!session}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
