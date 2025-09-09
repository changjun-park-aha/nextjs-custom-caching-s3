import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { votes, posts, comments, users } from '../../../schemas'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { Auth } from '../../../lib/auth'

// Validation schemas
const createVoteSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(['post', 'comment']),
  voteType: z.enum(['upvote', 'downvote']),
})

// POST /api/votes - Create or update vote (authenticated)
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await Auth.requireAuth(request)
    
    if (response) return response

    const body = await request.json()
    const validatedData = createVoteSchema.parse(body)

    // Verify target exists
    let targetExists = false
    if (validatedData.targetType === 'post') {
      const postExists = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.id, validatedData.targetId), isNull(posts.deletedAt)))
        .limit(1)
      targetExists = postExists.length > 0
    } else {
      const commentExists = await db
        .select({ id: comments.id })
        .from(comments)
        .where(and(eq(comments.id, validatedData.targetId), isNull(comments.deletedAt)))
        .limit(1)
      targetExists = commentExists.length > 0
    }

    if (!targetExists) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // Check if user already voted
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, session.user.id),
          eq(votes.targetId, validatedData.targetId),
          eq(votes.targetType, validatedData.targetType),
          isNull(votes.deletedAt)
        )
      )
      .limit(1)

    if (existingVote.length > 0) {
      // If same vote type, remove it (toggle off)
      if (existingVote[0]!.voteType === validatedData.voteType) {
        await db
          .update(votes)
          .set({ deletedAt: new Date() })
          .where(eq(votes.id, existingVote[0]!.id))

        // Update target vote counts
        await updateVoteCounts(validatedData.targetType, validatedData.targetId)

        return NextResponse.json({ message: 'Vote removed' })
      } else {
        // Different vote type, update it
        await db
          .update(votes)
          .set({ 
            voteType: validatedData.voteType,
            updatedAt: new Date()
          })
          .where(eq(votes.id, existingVote[0]!.id))

        // Update target vote counts
        await updateVoteCounts(validatedData.targetType, validatedData.targetId)

        return NextResponse.json({ message: 'Vote updated' })
      }
    } else {
      // Create new vote
      const newVote = await db
        .insert(votes)
        .values({
          userId: session.user.id,
          targetId: validatedData.targetId,
          targetType: validatedData.targetType,
          voteType: validatedData.voteType,
        })
        .returning()

      // Update target vote counts
      await updateVoteCounts(validatedData.targetType, validatedData.targetId)

      return NextResponse.json(newVote[0], { status: 201 })
    }
  } catch (error) {
    console.error('Error handling vote:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to handle vote' }, { status: 500 })
  }
}

// Helper function to update vote counts
async function updateVoteCounts(targetType: string, targetId: string) {
  const upvoteCount = await db
    .select({ count: votes.id })
    .from(votes)
    .where(
      and(
        eq(votes.targetId, targetId),
        eq(votes.targetType, targetType),
        eq(votes.voteType, 'upvote'),
        isNull(votes.deletedAt)
      )
    )

  const downvoteCount = await db
    .select({ count: votes.id })
    .from(votes)
    .where(
      and(
        eq(votes.targetId, targetId),
        eq(votes.targetType, targetType),
        eq(votes.voteType, 'downvote'),
        isNull(votes.deletedAt)
      )
    )

  if (targetType === 'post') {
    await db
      .update(posts)
      .set({
        upvotes: upvoteCount.length,
        downvotes: downvoteCount.length,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, targetId))
  } else {
    await db
      .update(comments)
      .set({
        upvotes: upvoteCount.length,
        downvotes: downvoteCount.length,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, targetId))
  }
}

// GET /api/votes?userId=xxx&targetId=xxx&targetType=xxx - Get user's vote for target
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const targetId = searchParams.get('targetId')
    const targetType = searchParams.get('targetType')

    if (!userId || !targetId || !targetType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const userVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.targetId, targetId),
          eq(votes.targetType, targetType),
          isNull(votes.deletedAt)
        )
      )
      .limit(1)

    return NextResponse.json(userVote.length > 0 ? userVote[0] : null)
  } catch (error) {
    console.error('Error fetching vote:', error)
    return NextResponse.json({ error: 'Failed to fetch vote' }, { status: 500 })
  }
}