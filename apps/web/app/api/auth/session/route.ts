import { NextRequest, NextResponse } from 'next/server'
import { Auth } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await Auth.getSession(request)
    
    if (!session) {
      return NextResponse.json({ user: null })
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Session failed' }, { status: 500 })
  }
}