import { SiteSidebar } from '@/components/site-sidebar'
import { getCurrentUser } from '@/lib/auth'
import { isPresenterOnActiveEvent } from '@/lib/leaderboard/presenter-gate'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const isPresenter = user
    ? await isPresenterOnActiveEvent(user.id, user.email)
    : false

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <SiteSidebar
        signedIn={!!user}
        showAdminLink={user?.hasAdminAccess ?? false}
        showPresenterLinks={isPresenter}
        displayName={user?.profile?.full_name ?? null}
        displayEmail={user?.email}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
