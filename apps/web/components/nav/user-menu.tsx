'use client'

import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

export function UserMenu() {
  const { session, status, logout } = useAuth()

  const handleSignOut = useCallback(async () => {
    await logout()
  }, [logout])

  if (status === 'loading') {
    return <div className="flex items-center space-x-4">Loading</div>
  }

  if (!session) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/auth/login">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/auth/signup">
          <Button>Sign Up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{session.user.nickname}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/settings/password"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Change Password</span>
            </Link>
          </DropdownMenuItem>
          {session.user.isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
