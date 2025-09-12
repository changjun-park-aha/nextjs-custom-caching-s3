'use client'

import { Button } from '@workspace/ui/components/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export function CreateFirstPost() {
  const { session } = useAuth()

  if (!session) {
    return (
      <Button asChild>
        <Link href="/auth/login">Sign In to Create Post</Link>
      </Button>
    )
  }

  return (
    <Button asChild>
      <Link href="/posts/create">
        <Plus className="mr-2 h-4 w-4" />
        Create First Post
      </Link>
    </Button>
  )
}
