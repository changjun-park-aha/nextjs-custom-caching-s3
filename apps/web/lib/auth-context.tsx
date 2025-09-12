'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext } from 'react'

export interface User {
  id: string
  email: string
  nickname: string
  isAdmin: boolean
}

export interface Session {
  user: User
}

interface AuthContextType {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// Custom hooks for session management
const useSessionQuery = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<Session | null> => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (data.user) {
          return data
        } else {
          return null
        }
      } catch (error) {
        console.error('Session fetch error:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 2
    },
  })
}

const useLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      return { user: data.user }
    },
    onSuccess: (data) => {
      // Update the session cache
      queryClient.setQueryData(['session'], data)
    },
  })
}

const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      // Set session to null
      queryClient.setQueryData(['session'], null)
    },
    onError: (error) => {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      queryClient.clear()
      queryClient.setQueryData(['session'], null)
    },
  })
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading, refetch } = useSessionQuery()
  const loginMutation = useLoginMutation()
  const logoutMutation = useLogoutMutation()

  const status: 'loading' | 'authenticated' | 'unauthenticated' = isLoading
    ? 'loading'
    : session
      ? 'authenticated'
      : 'unauthenticated'

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await loginMutation.mutateAsync({ email, password })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred during login',
      }
    }
  }

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const refresh = async () => {
    await refetch()
  }

  const contextValue: AuthContextType = {
    session: session || null,
    status,
    login,
    logout,
    refresh,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Compatibility hooks for easier migration
export function useSession() {
  const { session, status } = useAuth()
  return {
    data: session,
    status:
      status === 'loading'
        ? 'loading'
        : status === 'authenticated'
          ? 'authenticated'
          : 'unauthenticated',
  }
}
