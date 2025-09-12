import { Home } from 'lucide-react'
import Link from 'next/link'

export function LogoAndHome() {
  return (
    <div className="flex items-center space-x-4">
      <Link href="/" className="flex items-center space-x-2">
        <Home className="h-6 w-6" />
        <span className="font-bold text-xl">Forum</span>
      </Link>
    </div>
  )
}
