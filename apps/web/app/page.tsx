'use client'

import { Button } from '@workspace/ui/components/button'
import { useQueryPosts } from '@/app/_hooks/use-query-posts'
import { PostCallToAction } from '@/app/post-call-to-action'
import { PostsList } from '@/app/posts-list'
import { useAuth } from '@/lib/auth-context'
import 'highlight.js/styles/github.css'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { session } = useAuth()
  const { data: posts = [], isLoading: loading, error } = useQueryPosts()

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div>Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-bold text-3xl">Latest Posts</h1>
          <p className="text-gray-600">
            Discover and discuss topics with the community
          </p>
        </div>

        {session && (
          <Button asChild>
            <Link href="/posts/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        <PostsList />
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      <PostCallToAction isVisible={posts.length > 0} />
    </div>
  )
}
