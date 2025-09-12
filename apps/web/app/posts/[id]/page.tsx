import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import CommentList from '@/app/posts/[id]/comment-list'
import PostItemController from '@/app/posts/[id]/post-item-controller'
import type { Post } from '@/schemas/posts'
import 'highlight.js/styles/github.css'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CommentSubmitForm } from './comment-submit-form'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: postId } = await params
  const queryClient = new QueryClient()
  const post = await queryClient.fetchQuery({
    queryKey: ['post', postId],
    queryFn: async (): Promise<Post | null> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts/${postId}`,
      )
      if (!response.ok) {
        return null
      }
      const result = await response.json()
      return result
    },
  })

  if (!post) {
    notFound()
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <PostItemController postId={postId} />
          </CardHeader>
          <CardContent>
            <div className="dark:prose-invert prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
        <CommentSubmitForm postId={postId} />
        <CommentList postId={postId} />
      </div>
    </HydrationBoundary>
  )
}
