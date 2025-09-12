'use client'

import { Card, CardContent } from '@workspace/ui/components/card'
import { MessageCircle } from 'lucide-react'
import { useQueryPosts } from '@/app/_hooks/use-query-posts'
import { CreateFirstPost } from '@/app/create-first-post'
import { PostCard } from '@/app/post-card'

export function PostsList() {
  const { data: posts = [] } = useQueryPosts()

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="py-8">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 font-medium text-gray-900 text-lg">
              No posts yet
            </h3>
            <p className="mb-4 text-gray-600">
              Be the first to start a discussion!
            </p>
            <CreateFirstPost />
          </div>
        </CardContent>
      </Card>
    )
  }

  return posts.map((post) => <PostCard key={post.id} postId={post.id} />)
}
