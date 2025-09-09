import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getServerSession } from 'next-auth/next'
import { db } from '../../../lib/db'
import { comments, users, posts } from '../../../schemas'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../lib/auth'

const app = new Hono().basePath('/api/comments')

// Validation schemas
const createCommentSchema = z.object({
  content: z.string().min(1),
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  mentionedUserId: z.string().uuid().optional(),
})

const updateCommentSchema = z.object({
  content: z.string().min(1),
})

// GET /api/comments?postId=xxx - Get comments for a post
app.get('/', async (c) => {
  try {
    const postId = c.req.query('postId')
    
    if (!postId) {
      return c.json({ error: 'postId is required' }, 400)
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

    return c.json(postComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return c.json({ error: 'Failed to fetch comments' }, 500)
  }
})

// GET /api/comments/:id - Get single comment
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
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
      .leftJoin(users, and(eq(comments.authorId, users.id), isNull(users.deletedAt)))
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (comment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    return c.json(comment[0])
  } catch (error) {
    console.error('Error fetching comment:', error)
    return c.json({ error: 'Failed to fetch comment' }, 500)
  }
})

// POST /api/comments - Create new comment/reply (authenticated)
app.post('/', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const validatedData = createCommentSchema.parse(body)

    // Verify post exists
    const post = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, validatedData.postId), isNull(posts.deletedAt)))
      .limit(1)

    if (post.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    // If parentId is provided, verify parent comment exists
    if (validatedData.parentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, validatedData.parentId), isNull(comments.deletedAt)))
        .limit(1)

      if (parentComment.length === 0) {
        return c.json({ error: 'Parent comment not found' }, 404)
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

    return c.json(newComment[0], 201)
  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Validation error' }, 400)
    }

    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

// PUT /api/comments/:id - Update comment (authenticated, author only)
app.put('/:id', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateCommentSchema.parse(body)

    // Check if comment exists and user is the author
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (existingComment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    if (existingComment[0]!.authorId !== session.user.id && !session.user.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: validatedData.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning()

    return c.json(updatedComment[0])
  } catch (error) {
    console.error('Error updating comment:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Validation error' }, 400)
    }

    return c.json({ error: 'Failed to update comment' }, 500)
  }
})

// DELETE /api/comments/:id - Soft delete comment (authenticated, author or admin)
app.delete('/:id', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')

    // Check if comment exists and user has permission
    const existingComment = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
      .limit(1)

    if (existingComment.length === 0) {
      return c.json({ error: 'Comment not found' }, 404)
    }

    if (existingComment[0]!.authorId !== session.user.id && !session.user.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await db
      .update(comments)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(comments.id, id))

    return c.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return c.json({ error: 'Failed to delete comment' }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)