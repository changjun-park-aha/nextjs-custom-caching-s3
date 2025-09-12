'use client'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Card, CardContent } from '@workspace/ui/components/card'
import { useQueryComments } from '@/app/_hooks/use-query-comments'
import { useQueryPost } from '@/app/_hooks/use-query-post'
import 'highlight.js/styles/github.css'
import { useParams } from 'next/navigation'
import { CommentItem } from './comment-item'
import { CommentSubmitForm } from './comment-submit-form'
import { PostItem } from './post-item'

export default function PostPage() {
  const params = useParams()
  const postId = params.id as string

  // React Query hooks
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQueryPost(postId)
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQueryComments(postId)

  const loading = postLoading || commentsLoading
  const error = postError || commentsError

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div>Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div>Post not found</div>
      </div>
    )
  }

  const topLevelComments = comments.filter((c) => !c.parentId)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Post */}
      <PostItem postId={post.id} />

      {/* Comment Form */}
      <CommentSubmitForm postId={post.id} />

      {/* Comments */}
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
            <CommentItem key={comment.id} comment={comment} postId={post.id} />
          ))
        )}
      </div>
    </div>
  )
}
