'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface PostCallToActionProps {
  isVisible: boolean
}

export function PostCallToAction({ isVisible }: PostCallToActionProps) {
  const { session } = useAuth()

  if (session || !isVisible) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardContent className="pt-6 text-center">
        <div className="py-4">
          <h3 className="mb-2 font-medium text-lg">Join the Discussion</h3>
          <p className="mb-4 text-gray-600">
            Sign in to vote on posts, comment, and create your own content.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
