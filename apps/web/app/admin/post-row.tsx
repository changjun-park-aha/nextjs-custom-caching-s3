'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Eye, ThumbsDown, ThumbsUp, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import type { Post } from '@/schemas'
import { useMutationDeletePost } from '../_hooks/use-mutation-delete-post'
import { useQueryAdminPost } from '../_hooks/use-query-admin-post'
import { useQueryUser } from '../_hooks/use-query-user'

interface PostRowProps {
  postId: Post['id']
}

export function PostRow({ postId }: PostRowProps) {
  const { data: post } = useQueryAdminPost(postId)
  const { mutate: mutateDeletePost } = useMutationDeletePost()
  const { data: author } = useQueryUser(post?.authorId || '')

  const handleDeletePost = (id: string) => {
    mutateDeletePost(id)
  }

  if (!post) {
    return null
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{post.title}</h3>
            <div className="mt-2 flex items-center space-x-4 text-gray-600 text-sm">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{author?.nickname || 'Unknown'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.upvotes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ThumbsDown className="h-4 w-4" />
                <span>{post.downvotes}</span>
              </div>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="ml-4 flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/posts/${post.id}`}>
                <Eye className="mr-1 h-4 w-4" />
                View
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePost(post.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
