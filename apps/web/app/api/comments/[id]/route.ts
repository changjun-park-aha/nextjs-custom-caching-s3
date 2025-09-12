import { and, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { comments, users } from '../../../../schemas'

// Validation schema for updates
const updateCommentSchema = z.object({
  content: z.string().min(1),
})

// GET /api/comments/[id] - Get single comment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const comment = await db
      .select({
        id: comments.id,
        content: comments.content,
        postId: comments.postId,
        parentId: comments.parentId,
        mentionedUserId: comments.mentionedUserId,
        upvotes: comments.upvotes,
        downvotes: comments.downvotes,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          nickname: users.nickname,
        },
      })
      .from(comments)
      .leftJoin(
        users,
        and(eq(comments.authorId, users.id), isNull(users.deletedAt)),
      )
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (comment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    return NextResponse.json(comment[0])
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comment' },
      { status: 500 },
    )
  }
}

// PUT /api/comments/[id] - Update comment (authenticated, author only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await Auth.requireAuth(request)

    if (response || !session) return response

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Check if comment exists and user is the author
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (existingComment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (
      existingComment[0]!.authorId !== session.user.id &&
      !session.user.isAdmin
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: validatedData.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning()

    return NextResponse.json(updatedComment[0])
  } catch (error) {
    console.error('Error updating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 },
    )
  }
}

// DELETE /api/comments/[id] - Soft delete comment (authenticated, author or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await Auth.requireAuth(request)

    if (response || !session) return response

    const { id } = await params

    // Check if comment exists and user has permission
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (existingComment.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (
      existingComment[0]!.authorId !== session.user.id &&
      !session.user.isAdmin
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db
      .update(comments)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(comments.id, id))

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 },
    )
  }
}
