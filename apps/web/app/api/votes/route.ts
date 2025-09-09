import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getServerSession } from 'next-auth/next'
import { db } from '../../../lib/db'
import { votes, posts, comments, users } from '../../../schemas'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../lib/auth'

const app = new Hono().basePath('/api/votes')

// Validation schemas
const createVoteSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(['post', 'comment']),
  voteType: z.enum(['upvote', 'downvote']),
})

// GET /api/votes?targetId=xxx&targetType=post|comment - Get votes for a target
app.get('/', async (c) => {
  try {
    const targetId = c.req.query('targetId')
    const targetType = c.req.query('targetType')
    
    if (!targetId || !targetType) {
      return c.json({ error: 'targetId and targetType are required' }, 400)
    }

    if (!['post', 'comment'].includes(targetType)) {
      return c.json({ error: 'targetType must be post or comment' }, 400)
    }

    const targetVotes = await db
      .select({
        id: votes.id,
        userId: votes.userId,
        targetId: votes.targetId,
        targetType: votes.targetType,
        voteType: votes.voteType,
        createdAt: votes.createdAt,
        user: {
          id: users.id,
          nickname: users.nickname,
        },
      })
      .from(votes)
      .leftJoin(users, and(eq(votes.userId, users.id), isNull(users.deletedAt)))
      .where(
        and(
          eq(votes.targetId, targetId),
          eq(votes.targetType, targetType),
          isNull(votes.deletedAt)
        )
      )
      .orderBy(desc(votes.createdAt))

    // Count upvotes and downvotes
    const upvotes = targetVotes.filter(v => v.voteType === 'upvote').length
    const downvotes = targetVotes.filter(v => v.voteType === 'downvote').length

    return c.json({
      votes: targetVotes,
      summary: {
        upvotes,
        downvotes,
        total: upvotes + downvotes,
      }
    })
  } catch (error) {
    console.error('Error fetching votes:', error)
    return c.json({ error: 'Failed to fetch votes' }, 500)
  }
})

// GET /api/votes/:id - Get single vote
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const vote = await db
      .select({
        id: votes.id,
        userId: votes.userId,
        targetId: votes.targetId,
        targetType: votes.targetType,
        voteType: votes.voteType,
        createdAt: votes.createdAt,
        user: {
          id: users.id,
          nickname: users.nickname,
        },
      })
      .from(votes)
      .leftJoin(users, and(eq(votes.userId, users.id), isNull(users.deletedAt)))
      .where(and(eq(votes.id, id), isNull(votes.deletedAt)))
      .limit(1)

    if (vote.length === 0) {
      return c.json({ error: 'Vote not found' }, 404)
    }

    return c.json(vote[0])
  } catch (error) {
    console.error('Error fetching vote:', error)
    return c.json({ error: 'Failed to fetch vote' }, 500)
  }
})

// POST /api/votes - Create/update vote (authenticated)
app.post('/', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const validatedData = createVoteSchema.parse(body)

    // Verify target exists
    if (validatedData.targetType === 'post') {
      const post = await db
        .select()
        .from(posts)
        .where(and(eq(posts.id, validatedData.targetId), isNull(posts.deletedAt)))
        .limit(1)

      if (post.length === 0) {
        return c.json({ error: 'Post not found' }, 404)
      }
    } else if (validatedData.targetType === 'comment') {
      const comment = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, validatedData.targetId), isNull(comments.deletedAt)))
        .limit(1)

      if (comment.length === 0) {
        return c.json({ error: 'Comment not found' }, 404)
      }
    }

    // Check if user already voted on this target
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

    let result

    if (existingVote.length > 0) {
      const currentVote = existingVote[0]!
      
      if (currentVote.voteType === validatedData.voteType) {
        // Same vote type - remove vote (toggle off)
        await db
          .update(votes)
          .set({ deletedAt: new Date() })
          .where(eq(votes.id, currentVote.id))
        
        result = { message: 'Vote removed', action: 'removed' }
      } else {
        // Different vote type - update vote
        const updatedVote = await db
          .update(votes)
          .set({
            voteType: validatedData.voteType,
            updatedAt: new Date(),
          })
          .where(eq(votes.id, currentVote.id))
          .returning()
        
        result = { vote: updatedVote[0], action: 'updated' }
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

      result = { vote: newVote[0], action: 'created' }
    }

    // Update vote counts on the target
    await updateVoteCounts(validatedData.targetId, validatedData.targetType)

    return c.json(result, 201)
  } catch (error) {
    console.error('Error creating/updating vote:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0]?.message || 'Validation error' }, 400)
    }

    return c.json({ error: 'Failed to process vote' }, 500)
  }
})

// DELETE /api/votes/:id - Delete vote (authenticated, owner only)
app.delete('/:id', async (c) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')

    // Check if vote exists and user owns it
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.id, id), isNull(votes.deletedAt)))
      .limit(1)

    if (existingVote.length === 0) {
      return c.json({ error: 'Vote not found' }, 404)
    }

    if (existingVote[0]!.userId !== session.user.id && !session.user.isAdmin) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const vote = existingVote[0]!

    await db
      .update(votes)
      .set({ deletedAt: new Date() })
      .where(eq(votes.id, id))

    // Update vote counts on the target
    await updateVoteCounts(vote.targetId, vote.targetType)

    return c.json({ message: 'Vote deleted successfully' })
  } catch (error) {
    console.error('Error deleting vote:', error)
    return c.json({ error: 'Failed to delete vote' }, 500)
  }
})

// Helper function to update vote counts
async function updateVoteCounts(targetId: string, targetType: string) {
  try {
    // Get current vote counts
    const voteResults = await db
      .select({
        voteType: votes.voteType,
      })
      .from(votes)
      .where(
        and(
          eq(votes.targetId, targetId),
          eq(votes.targetType, targetType),
          isNull(votes.deletedAt)
        )
      )

    const upvotes = voteResults.filter(v => v.voteType === 'upvote').length
    const downvotes = voteResults.filter(v => v.voteType === 'downvote').length

    // Update the target entity
    if (targetType === 'post') {
      await db
        .update(posts)
        .set({
          upvotes,
          downvotes,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, targetId))
    } else if (targetType === 'comment') {
      await db
        .update(comments)
        .set({
          upvotes,
          downvotes,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, targetId))
    }
  } catch (error) {
    console.error('Error updating vote counts:', error)
  }
}

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)