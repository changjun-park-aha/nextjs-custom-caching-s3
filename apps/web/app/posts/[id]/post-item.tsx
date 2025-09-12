'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Edit, Trash2, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useQueryPost } from '@/app/_hooks/use-query-post'
import { useQueryUser } from '@/app/_hooks/use-query-user'
import { useAuth } from '@/lib/auth-context'
import type { Post } from '@/schemas/posts'
import { VoteButtons } from './vote-buttons'

interface PostItemProps {
  postId: Post['id']
}

export function PostItem({ postId }: PostItemProps) {
  const { session } = useAuth()
  const user = session?.user

  const { data: post } = useQueryPost(postId)
  const { data: author } = useQueryUser(post?.authorId || '')

  if (!post) {
    return null
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <VoteButtons
            targetId={post.id}
            targetType="post"
            upvotes={post.upvotes}
            downvotes={post.downvotes}
          />

          <div className="flex-1">
            <h1 className="mb-2 font-bold text-2xl">{post.title}</h1>
            <div className="mb-4 flex items-center space-x-2 text-gray-600 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{author?.nickname}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {user && (user.id === author?.id || user.isAdmin) && (
                <>
                  <span>•</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
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
  )
}
