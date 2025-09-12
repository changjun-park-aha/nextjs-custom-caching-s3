import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { FeedHeader } from '@/app/feed-header'
import { PostCallToAction } from '@/app/post-call-to-action'
import { PostsList } from '@/app/posts-list'
import type { Post } from '@/schemas/posts'
import 'highlight.js/styles/github.css'

export default async function HomePage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts`,
      )
      if (!response.ok) {
        throw new Error('Failed to load posts')
      }
      return response.json()
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <FeedHeader />

        {/* Posts List */}
        <div className="space-y-6">
          <PostsList />
        </div>

        {/* Call to Action for Non-Authenticated Users */}
        <PostCallToAction isVisible />
      </div>
    </HydrationBoundary>
  )
}
