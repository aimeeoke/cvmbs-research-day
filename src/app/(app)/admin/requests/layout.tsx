import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

/**
 * Role requests + withdrawals are admin-only. Committee members reach the
 * outer /admin layout, but /admin/requests is off-limits for them. Belt +
 * suspenders — the sidebar links + admin homepage cards also hide this
 * for committee, and the server actions in ./actions.ts refuse if the
 * caller isn't a true admin.
 */
export default async function AdminRequestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/admin/requests')
  if (!user.isAdmin) redirect('/admin')
  return <>{children}</>
}
