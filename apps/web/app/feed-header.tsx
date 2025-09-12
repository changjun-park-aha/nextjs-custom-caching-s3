'use client'

import { Button } from '@workspace/ui/components/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function FeedHeader() {
  const { session } = useAuth()

  return (
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
  )
}
