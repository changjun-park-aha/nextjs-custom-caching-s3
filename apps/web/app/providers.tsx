'use client'

import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type * as React from 'react'
import getQueryClient from '@/app/single-query-client'
import { AuthProvider } from '../lib/auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient: QueryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </NextThemesProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
