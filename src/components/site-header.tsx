'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Calendar, Info, FileText, LogIn, LogOut, ShieldCheck } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  match: (path: string) => boolean
}

const publicNav: NavItem[] = [
  {
    href: '/schedule',
    label: 'Schedule',
    icon: <Calendar size={18} />,
    match: (p) => p.startsWith('/schedule'),
  },
  {
    href: '/about',
    label: 'About',
    icon: <Info size={18} />,
    match: (p) => p.startsWith('/about'),
  },
]

export function SiteHeader({
  signedIn,
  isAdmin,
  displayEmail,
}: {
  signedIn: boolean
  isAdmin: boolean
  displayEmail?: string | null
}) {
  const pathname = usePathname() || '/'

  const navItems: NavItem[] = [
    ...publicNav,
    ...(signedIn
      ? [
          {
            href: '/submit',
            label: 'Submit',
            icon: <FileText size={18} />,
            match: (p: string) => p.startsWith('/submit'),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: 'Admin',
            icon: <ShieldCheck size={18} />,
            match: (p: string) => p.startsWith('/admin'),
          },
        ]
      : []),
  ]

  return (
    <header className="bg-[#1E4D2B] text-white shadow-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <Image
            src="/CSU-Ram-Head.png"
            alt="CSU"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-base sm:text-lg truncate">CVMBS Research Day</div>
            <div className="text-xs text-white/70 hidden sm:block">2027</div>
          </div>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-[#1E4D2B]'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
          {signedIn ? (
            <Link
              href="/signout"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm text-white/90 hover:bg-white/10"
              title={displayEmail ?? undefined}
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm bg-[#C8C372] text-[#1E4D2B] font-semibold hover:bg-[#b7b166]"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
