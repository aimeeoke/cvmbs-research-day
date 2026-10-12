import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function AdminLeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/admin/leaderboard')
  if (!user.isAdmin) redirect('/admin')
  return <>{children}</>
}
