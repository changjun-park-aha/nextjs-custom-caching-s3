'use client'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQueryAdminComments } from '@/app/_hooks/use-query-admin-comments'
import { useQueryAdminPosts } from '@/app/_hooks/use-query-admin-posts'
import { useAuth } from '@/lib/auth-context'

import { PostRow } from './post-row'

export default function AdminPage() {
  const { session, status } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts')

  const isAdmin = status === 'authenticated' && !!session?.user?.isAdmin

  // React Query hooks
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
  } = useQueryAdminPosts(isAdmin)
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQueryAdminComments(isAdmin)

  const loading = postsLoading || commentsLoading
  const error = postsError || commentsError

  // Redirect non-admin users
  if (
    status === 'unauthenticated' ||
    (status === 'authenticated' && !session?.user?.isAdmin)
  ) {
    router.push('/')
    return null
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div>Loading...</div>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h1 className="mb-4 font-bold text-2xl">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Admin Panel</h1>
        <p className="text-gray-600">Manage forum content and users</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-gray-600 text-sm">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{posts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-gray-600 text-sm">
              Total Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{comments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-gray-600 text-sm">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {new Set(posts.map((p) => p.authorId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-gray-200 border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`border-b-2 px-1 py-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            type="button"
          >
            Posts ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`border-b-2 px-1 py-2 font-medium text-sm ${
              activeTab === 'comments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Comments ({comments.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-semibold text-xl">Recent Posts</h2>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                No posts found.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostRow key={post.id} postId={post.id} />)
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-semibold text-xl">Recent Comments</h2>
          </div>

          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Comment management coming soon. For now, you can manage comments
              by visiting individual posts.
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
