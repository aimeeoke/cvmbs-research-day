'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogIn, LogOut, X, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { publicNav, authNav, utilityNav, adminNav, type NavItem } from '@/lib/nav'

type Props = {
  signedIn: boolean
  isAdmin: boolean
  displayName?: string | null
  displayEmail?: string | null
}

export function SiteSidebar({ signedIn, isAdmin, displayName, displayEmail }: Props) {
  const pathname = usePathname() || '/'
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-close the mobile drawer whenever we navigate.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const items: NavItem[] = [
    ...publicNav,
    ...(signedIn ? authNav : []),
  ]

  return (
    <>
      {/* Mobile top bar: only visible on small screens */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 bg-[#1E4D2B] text-white px-4 py-3 shadow">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-white/10"
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/CSU-Ram-Head.png"
            alt="CSU"
            width={28}
            height={28}
            className="rounded-full flex-shrink-0"
          />
          <span className="font-semibold truncate">CVMBS Research Day</span>
        </Link>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 h-screen w-64 z-50',
          // Desktop: sticky sidebar.
          'lg:sticky lg:top-0 lg:h-screen lg:shrink-0',
          // Mobile: drawer toggled by hamburger.
          'fixed inset-y-0 left-0 transition-transform duration-200 lg:transition-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image
              src="/CSU-Ram-Head.png"
              alt="CSU"
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
            />
            <span className="font-semibold text-gray-900 truncate">CVMBS Research Day</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User summary (auth only) */}
        {signedIn && (
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName || displayEmail || 'Signed in'}
            </p>
            {displayEmail && displayName && (
              <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
            )}
          </div>
        )}

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </nav>

        {/* Utility / admin / sign-in-out at the bottom */}
        <div className="p-2 border-t border-gray-200 space-y-1">
          {isAdmin &&
            adminNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          {signedIn &&
            utilityNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          {signedIn ? (
            <Link
              href="/signout"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Sign out
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold bg-[#1E4D2B] text-white hover:bg-[#163d22]"
            >
              <LogIn className="h-5 w-5 flex-shrink-0" />
              Sign in / Create account
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname)
  const Icon = item.icon
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active ? 'bg-[#1E4D2B] text-white' : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  )
}
