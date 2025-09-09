import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users } from '../schemas/users'
import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials)
        
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          
          try {
            const userList = await db
              .select()
              .from(users)
              .where(and(eq(users.email, email), isNull(users.deletedAt)))
              .limit(1)
            
            if (userList.length === 0) return null
            
            const foundUser = userList[0]!
            const passwordsMatch = await bcrypt.compare(password, foundUser.password)
            
            if (passwordsMatch) {
              return {
                id: foundUser.id,
                email: foundUser.email,
                nickname: foundUser.nickname,
                isAdmin: foundUser.isAdmin,
              }
            }
          } catch (error) {
            console.error('Auth error:', error)
            return null
          }
        }
        
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.nickname = user.nickname
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.nickname = token.nickname
        session.user.isAdmin = token.isAdmin
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}

export default NextAuth(authOptions)