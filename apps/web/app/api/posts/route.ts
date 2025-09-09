import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getServerSession } from 'next-auth/next'
import { db } from '../../../lib/db'
import { posts, users } from '../../../schemas'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../lib/auth'

const app = new Hono().basePath('/api/posts')

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
})

const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
})

// GET /api/posts - List all posts (public)
app.get('/', async (c) => {
  try {
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          nickname: users.nickname,
        },
      })
      .from(posts)
      .leftJoin(users, and(eq(posts.authorId, users.id), isNull(users.deletedAt)))
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))

    return c.json(allPosts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// GET /api/posts/:id - Get single post
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const post = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          nickname: users.nickname,
        },
      })
      .from(posts)
      .leftJoin(users, and(eq(posts.authorId, users.id), isNull(users.deletedAt)))
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (post.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    return c.json(post[0])
  } catch (error) {
    console.error('Error fetching post:', error)
    return c.json({ error: 'Failed to fetch post' }, 500)
  }
})

// POST /api/posts - Create new post (authenticated)
app.post('/', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const validatedData = createPostSchema.parse(body)

    const newPost = await db
      .insert(posts)
      .values({
        title: validatedData.title,
        content: validatedData.content,
        authorId: session.user.id,
      })
      .returning()

    return c.json(newPost[0], 201)
  } catch (error) {
    console.error('Error creating post:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Validation error' }, 400)
    }

    return c.json({ error: 'Failed to create post' }, 500)
  }
})

// PUT /api/posts/:id - Update post (authenticated, author only)
app.put('/:id', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updatePostSchema.parse(body)

    // Check if post exists and user is the author
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (existingPost.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    if (existingPost[0]!.authorId !== session.user.id && !session.user.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const updatedPost = await db
      .update(posts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()

    return c.json(updatedPost[0])
  } catch (error) {
    console.error('Error updating post:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Validation error' }, 400)
    }

    return c.json({ error: 'Failed to update post' }, 500)
  }
})

// DELETE /api/posts/:id - Soft delete post (authenticated, author or admin)
app.delete('/:id', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')

    // Check if post exists and user has permission
    const existingPost = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)

    if (existingPost.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    if (existingPost[0]!.authorId !== session.user.id && !session.user.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await db
      .update(posts)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(posts.id, id))

    return c.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return c.json({ error: 'Failed to delete post' }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)