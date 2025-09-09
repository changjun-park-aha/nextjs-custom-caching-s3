import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { comments, users, posts } from '../../../schemas'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import { Auth } from '../../../lib/auth'

// Validation schemas
const createCommentSchema = z.object({
  content: z.string().min(1),
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  mentionedUserId: z.string().uuid().optional(),
})

// GET /api/comments?postId=xxx - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const postComments = await db
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
      .leftJoin(users, and(eq(comments.authorId, users.id), isNull(users.deletedAt)))
      .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json(postComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/comments - Create new comment (authenticated)
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await Auth.requireAuth(request)
    
    if (response) return response

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Verify post exists
    const postExists = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, validatedData.postId), isNull(posts.deletedAt)))
      .limit(1)

    if (postExists.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If parentId is provided, verify parent comment exists
    if (validatedData.parentId) {
      const parentExists = await db
        .select({ id: comments.id })
        .from(comments)
        .where(and(eq(comments.id, validatedData.parentId), isNull(comments.deletedAt)))
        .limit(1)

      if (parentExists.length === 0) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    const newComment = await db
      .insert(comments)
      .values({
        content: validatedData.content,
        postId: validatedData.postId,
        parentId: validatedData.parentId,
        mentionedUserId: validatedData.mentionedUserId,
        authorId: session.user.id,
      })
      .returning()

    return NextResponse.json(newComment[0], { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}