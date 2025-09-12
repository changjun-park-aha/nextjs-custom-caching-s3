import { and, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { posts, users } from '../../../../schemas'

// Validation schema for updates
const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
})

// GET /api/posts/[id] - Get single post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const post = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorId: posts.authorId,
      })
      .from(posts)
      .leftJoin(
        users,
        and(eq(posts.authorId, users.id), isNull(users.deletedAt)),
      )
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post[0])
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PUT /api/posts/[id] - Update post (authenticated, author only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await Auth.requireAuth(request)

    if (response || !session) return response

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePostSchema.parse(body)

    // Check if post exists and user is the author
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (existingPost.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (
      existingPost[0]!.authorId !== session.user.id &&
      !session.user.isAdmin
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedPost = await db
      .update(posts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()

    return NextResponse.json(updatedPost[0])
  } catch (error) {
    console.error('Error updating post:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 },
    )
  }
}

// DELETE /api/posts/[id] - Soft delete post (authenticated, author or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await Auth.requireAuth(request)

    if (response || !session) return response

    const { id } = await params

    // Check if post exists and user has permission
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (existingPost.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (
      existingPost[0]!.authorId !== session.user.id &&
      !session.user.isAdmin
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db
      .update(posts)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(posts.id, id))

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 },
    )
  }
}
