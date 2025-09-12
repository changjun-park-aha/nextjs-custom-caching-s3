'use client'

import { Button } from '@workspace/ui/components/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function CreatePostButton() {
  const { session } = useAuth()

  if (!session) {
    return null
  }

  return (
    <Button variant="ghost" className="flex items-center space-x-2" asChild>
      <Link href="/posts/create">
        <Plus className="h-4 w-4" />
        <span>Create Post</span>
      </Link>
    </Button>
  )
}
