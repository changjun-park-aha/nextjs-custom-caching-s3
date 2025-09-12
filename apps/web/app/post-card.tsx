'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { MessageCircle, User } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useQueryUser } from '@/app/_hooks/use-query-user'
import type { Post } from '@/schemas/posts'
import { useQueryPost } from './_hooks/use-query-post'
import { VoteButtons } from './posts/[id]/vote-buttons'

interface PostCardProps {
  postId: Post['id']
}

export function PostCard({ postId }: PostCardProps) {
  const { data: post } = useQueryPost(postId)
  const { data: author } = useQueryUser(post?.authorId || '')

  if (!post) {
    return null
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <VoteButtons
            targetId={postId}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            targetType="post"
          />

          <div className="min-w-0 flex-1">
            <Link
              href={`/posts/${post.id}`}
              className="block transition-colors hover:text-blue-600"
            >
              <h2 className="mb-2 line-clamp-2 font-semibold text-xl">
                {post.title}
              </h2>
            </Link>

            <div className="mb-3 flex items-center space-x-2 text-gray-600 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{author?.nickname}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="line-clamp-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Limit rendering to simple elements for preview
                    h1: ({ children }) => (
                      <span className="font-bold text-lg">{children}</span>
                    ),
                    h2: ({ children }) => (
                      <span className="font-bold text-base">{children}</span>
                    ),
                    h3: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h4: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h5: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h6: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    blockquote: ({ children }) => (
                      <span className="text-gray-600 italic">{children}</span>
                    ),
                    ul: ({ children }) => <span>{children}</span>,
                    ol: ({ children }) => <span>{children}</span>,
                    li: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => <span>{children}</span>,
                  }}
                >
                  {post.content.length > 200
                    ? post.content.slice(0, 200) + '...'
                    : post.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Link href={`/posts/${post.id}`}>
            <Button variant="ghost" size="sm">
              <MessageCircle className="mr-2 h-4 w-4" />
              View Comments
            </Button>
          </Link>

          <div className="text-gray-500 text-sm">
            Score: {post.upvotes - post.downvotes}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
