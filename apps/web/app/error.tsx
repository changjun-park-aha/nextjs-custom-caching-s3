'use client'

export default function ErrorPage({
  error,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-red-600">
        {error instanceof Error ? error.message : 'An error occurred'}
      </p>
    </div>
  )
}
