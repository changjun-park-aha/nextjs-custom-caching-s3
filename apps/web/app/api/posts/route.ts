import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { db } from '../../../lib/db'
import { posts, users } from '../../../schemas'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../lib/auth'

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
})

// GET /api/posts - List all posts (public)
export async function GET() {
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

    return NextResponse.json(allPosts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/posts - Create new post (authenticated)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    const newPost = await db
      .insert(posts)
      .values({
        title: validatedData.title,
        content: validatedData.content,
        authorId: session.user.id,
      })
      .returning()

    return NextResponse.json(newPost[0], { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}