'use client'

import { Button } from '@workspace/ui/components/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutationVote } from '@/app/_hooks/use-mutation-vote'
import { useAuth } from '@/lib/auth-context'

export function VoteButtons({
  targetId,
  targetType,
  upvotes,
  downvotes,
}: {
  targetId: string
  targetType: 'post' | 'comment'
  upvotes: number
  downvotes: number
}) {
  const voteMutation = useMutationVote()
  const { session } = useAuth()
  const router = useRouter()

  const handleVote = (
    targetId: string,
    targetType: 'post' | 'comment',
    voteType: 'upvote' | 'downvote',
  ) => {
    const user = session?.user

    if (!user) {
      router.push('/auth/login')
      return
    }

    voteMutation.mutate({
      targetId,
      targetType,
      voteType,
    })
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(targetId, targetType, 'upvote')}
        className="h-8 w-8 p-1"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className="font-medium text-green-600 text-sm">{upvotes}</span>
      <span className="font-medium text-red-600 text-sm">{downvotes}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(targetId, targetType, 'downvote')}
        className="h-8 w-8 p-1"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
