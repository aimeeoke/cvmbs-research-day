import {
  Home,
  Info,
  Trophy,
  Users,
  Calendar,
  FileText,
  Gavel,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

const startsWith = (prefix: string) => (p: string) =>
  prefix === '/' ? p === '/' : p === prefix || p.startsWith(prefix + '/')

/** Nav items every visitor sees. */
export const publicNav: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
  { href: '/about', label: 'About', icon: Info, match: startsWith('/about') },
  { href: '/winners-2026', label: '2026 Winners', icon: Trophy, match: startsWith('/winners-2026') },
  { href: '/committee', label: '2027 Committee', icon: Users, match: startsWith('/committee') },
  { href: '/schedule', label: 'Schedule', icon: Calendar, match: startsWith('/schedule') },
]

/** Nav items only signed-in participants see (above public). */
export const authNav: NavItem[] = [
  { href: '/abstracts', label: 'Abstract Portal', icon: FileText, match: startsWith('/abstracts') },
  { href: '/judge', label: 'Volunteer to Judge', icon: Gavel, match: startsWith('/judge') },
]

/** Bottom-of-sidebar utilities. */
export const utilityNav: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, match: startsWith('/settings') },
]

/** Admin-only items (rendered above utility). */
export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Admin', icon: ShieldCheck, match: startsWith('/admin') },
]
