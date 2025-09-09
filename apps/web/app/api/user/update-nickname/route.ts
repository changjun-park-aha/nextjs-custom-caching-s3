import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { db } from '../../../../lib/db'
import { users } from '../../../../schemas/users'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../../lib/auth'

const updateNicknameSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required').max(100, 'Nickname too long'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateNicknameSchema.parse(body)

    // Update user nickname
    const updatedUser = await db
      .update(users)
      .set({
        nickname: validatedData.nickname,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, session.user.id), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        nickname: users.nickname,
      })

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Nickname updated successfully', user: updatedUser[0] },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update nickname error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}