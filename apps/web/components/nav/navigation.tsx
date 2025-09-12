'use client'

import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'
import { CreatePostButton } from '@/components/nav/create-post-button'
import { LogoAndHome } from '@/components/nav/logo-and-home'
import { UserMenu } from '@/components/nav/user-menu'

export function Navigation() {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Home */}
          <LogoAndHome />

          {/* Main Navigation */}
          <div className="hidden items-center space-x-4 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/">Posts</Link>
            </Button>
            <CreatePostButton />
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}
