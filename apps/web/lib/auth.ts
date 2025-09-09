import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users } from '../schemas/users'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { JWT, type JWTPayload } from './jwt'

const TOKEN_COOKIE_NAME = 'auth-token'

export interface User {
  id: string
  email: string
  nickname: string
  isAdmin: boolean
}

export interface Session {
  user: User
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export class Auth {
  // Get current session from request
  static async getSession(request?: NextRequest): Promise<Session | null> {
    try {
      let token: string | undefined

      if (request) {
        // For API routes - get from request cookies
        token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
      } else {
        // For server components - get from cookies() function
        const cookieStore = await cookies()
        token = cookieStore.get(TOKEN_COOKIE_NAME)?.value
      }

      if (!token) return null

      const payload = await JWT.verify(token)
      if (!payload) return null

      return {
        user: {
          id: payload.id,
          email: payload.email,
          nickname: payload.nickname,
          isAdmin: payload.isAdmin,
        }
      }
    } catch (error) {
      console.error('Session error:', error)
      return null
    }
  }

  // Login user
  static async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      const validation = loginSchema.safeParse({ email, password })
      if (!validation.success) return null

      const userList = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1)

      if (userList.length === 0) return null

      const user = userList[0]!
      const passwordsMatch = await bcrypt.compare(password, user.password)

      if (!passwordsMatch) return null

      const userData: User = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        isAdmin: user.isAdmin,
      }

      const token = await JWT.sign(userData)

      return { user: userData, token }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  // Set authentication cookie
  static setAuthCookie(response: NextResponse, token: string): void {
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })
  }

  // Clear authentication cookie
  static clearAuthCookie(response: NextResponse): void {
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
  }

  // Require authentication (for API routes)
  static async requireAuth(request: NextRequest): Promise<{ session: Session; response?: NextResponse }> {
    const session = await Auth.getSession(request)
    
    if (!session) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return { session: session as any, response }
    }

    return { session }
  }

  // Require admin (for API routes)
  static async requireAdmin(request: NextRequest): Promise<{ session: Session; response?: NextResponse }> {
    const { session, response } = await Auth.requireAuth(request)
    
    if (response) return { session, response }
    
    if (!session.user.isAdmin) {
      const forbiddenResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return { session, response: forbiddenResponse }
    }

    return { session }
  }
}

// Helper function for server components
export async function getServerSession(): Promise<Session | null> {
  return Auth.getSession()
}