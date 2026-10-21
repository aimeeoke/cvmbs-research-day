import {
  Home,
  Info,
  Trophy,
  Calendar,
  FileText,
  Gavel,
  Gamepad2,
  Leaf,
  Settings,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  /** Small text pill next to the label — used for "Soon" placeholders etc. */
  badge?: string
}

const startsWith = (prefix: string) => (p: string) =>
  prefix === '/' ? p === '/' : p === prefix || p.startsWith(prefix + '/')

/** Nav items every visitor sees. */
export const publicNav: NavItem[] = [
  { href: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
  { href: '/about', label: 'About', icon: Info, match: startsWith('/about') },
  { href: '/winners-2026', label: '2026 Winners', icon: Trophy, match: startsWith('/winners-2026') },
  { href: '/schedule', label: 'Schedule', icon: Calendar, match: startsWith('/schedule') },
  { href: '/green-labs', label: 'Green Labs', icon: Leaf, match: startsWith('/green-labs') },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: TrendingUp,
    match: startsWith('/leaderboard'),
  },
]

/** Nav items only signed-in participants see (above public). */
export const authNav: NavItem[] = [
  { href: '/abstracts', label: 'Abstract Portal', icon: FileText, match: startsWith('/abstracts') },
  { href: '/judge', label: 'Volunteer to Judge', icon: Gavel, match: startsWith('/judge') },
]

/** Presenter-only "game mode" items. Shown ONLY to users who are the
 *  presenter on a non-withdrawn active-event submission. Deliberately
 *  isolated from the main site vibe — see /achievements/page.tsx. */
export const presenterNav: NavItem[] = [
  { href: '/achievements', label: 'Achievements', icon: Gamepad2, match: startsWith('/achievements') },
]

/** Bottom-of-sidebar utilities. */
export const utilityNav: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, match: startsWith('/settings') },
]

/** Admin-only items (rendered above utility). */
export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Admin', icon: ShieldCheck, match: startsWith('/admin') },
]
