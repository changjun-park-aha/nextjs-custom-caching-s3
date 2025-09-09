import { NextRequest, NextResponse } from 'next/server'
import { Auth } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' })
    Auth.clearAuthCookie(response)
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}