import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

/**
 * Gates the whole /admin/* tree on admin OR committee_member. Committee
 * members are further restricted at the /admin/requests level (see the
 * layout inside that folder) since role requests + withdrawals are
 * admin-only.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/admin')
  if (!user.hasAdminAccess) redirect('/')
  return <>{children}</>
}
