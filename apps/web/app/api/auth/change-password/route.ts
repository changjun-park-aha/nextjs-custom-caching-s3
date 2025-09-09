import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import bcrypt from 'bcryptjs'
import { db } from '../../../../lib/db'
import { users } from '../../../../schemas/users'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { authOptions } from '../../../../lib/auth'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
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
    const validatedData = changePasswordSchema.parse(body)
    const { currentPassword, newPassword } = validatedData

    // Get current user
    const currentUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, session.user.id), isNull(users.deletedAt)))
      .limit(1)

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = currentUser[0]!

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json(
      { message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    
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