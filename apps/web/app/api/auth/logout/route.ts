import { type NextRequest, NextResponse } from 'next/server'
import { Auth } from '../../../../lib/auth'

// biome-ignore lint/suspicious/useAwait: 아직 구현 중
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' })
    Auth.clearAuthCookie(response)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
