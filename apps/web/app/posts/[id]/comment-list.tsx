'use client'

import { Card, CardContent } from '@workspace/ui/components/card'
import { useQueryComments } from '@/app/_hooks/use-query-comments'
import { CommentItem } from '@/app/posts/[id]/comment-item'

interface CommentListProps {
  postId: string
}

export default function CommentList({ postId }: CommentListProps) {
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQueryComments(postId)

  const topLevelComments = comments.filter((c) => !c.parentId)

  if (commentsLoading) {
    return <div>Loading comments...</div>
  }

  if (commentsError) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 text-center text-red-600">
          Failed to load comments.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-0">
      <h2 className="mb-6 font-bold text-xl">
        Comments ({topLevelComments.length})
      </h2>

      {topLevelComments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            No comments yet. Be the first to comment!
          </CardContent>
        </Card>
      ) : (
        topLevelComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))
      )}
    </div>
  )
}
