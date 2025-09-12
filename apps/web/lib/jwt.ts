import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
)

export interface JWTPayload {
  id: string
  email: string
  nickname: string
  isAdmin: boolean
  iat?: number
  exp?: number
}

// biome-ignore lint/complexity/noStaticOnlyClass: 굳이 꾸역꾸역 class를 쳐 써대는 AI문제
export class JWT {
  static async sign(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    return jwt
  }

  static async verify(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Validate payload structure
      if (
        typeof payload.id === 'string' &&
        typeof payload.email === 'string' &&
        typeof payload.nickname === 'string' &&
        typeof payload.isAdmin === 'boolean'
      ) {
        return {
          id: payload.id,
          email: payload.email,
          nickname: payload.nickname,
          isAdmin: payload.isAdmin,
          iat: payload.iat,
          exp: payload.exp,
        }
      }

      return null
    } catch (error) {
      console.error('JWT verification failed:', error)
      return null
    }
  }

  static async refresh(token: string): Promise<string | null> {
    const payload = await JWT.verify(token)
    if (!payload) return null

    // Create new token with fresh expiration
    const newPayload = {
      id: payload.id,
      email: payload.email,
      nickname: payload.nickname,
      isAdmin: payload.isAdmin,
    }

    return JWT.sign(newPayload)
  }
}
