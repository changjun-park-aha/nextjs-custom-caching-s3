'use client'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'

export default function ErrorPage({
  error,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertDescription>
        {error instanceof Error ? error.message : 'An error occurred'}
      </AlertDescription>
    </Alert>
  )
}
