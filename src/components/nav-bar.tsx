'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: '홈' },
  { href: '/players', label: '플레이어 관리' },
  { href: '/rooms', label: '내전 방' },
  { href: '/stats', label: '통계' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-5xl flex items-center gap-6 h-14">
        <Link href="/" className="font-bold text-lg text-yellow-400">
          🍌 banana-milk
        </Link>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors',
                pathname === link.href
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
