import { and, eq, isNull } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Auth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { users } from '../../../../schemas/users'

const updateNicknameSchema = z.object({
  nickname: z.string().min(1).max(50),
})

export async function PUT(request: NextRequest) {
  try {
    const { session, response } = await Auth.requireAuth(request)

    if (response || !session) return response

    const body = await request.json()
    const validatedData = updateNicknameSchema.parse(body)

    // Check if nickname is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.nickname, validatedData.nickname),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)

    if (existingUser.length > 0 && existingUser[0]!.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Nickname already taken' },
        { status: 400 },
      )
    }

    const updatedUser = await db
      .update(users)
      .set({
        nickname: validatedData.nickname,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning()

    return NextResponse.json({
      user: {
        id: updatedUser[0]!.id,
        email: updatedUser[0]!.email,
        nickname: updatedUser[0]!.nickname,
        isAdmin: updatedUser[0]!.isAdmin,
      },
    })
  } catch (error) {
    console.error('Error updating nickname:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to update nickname' },
      { status: 500 },
    )
  }
}
