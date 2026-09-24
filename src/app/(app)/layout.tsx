import { SiteSidebar } from '@/components/site-sidebar'
import { getCurrentUser } from '@/lib/auth'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <SiteSidebar
        signedIn={!!user}
        isAdmin={user?.isAdmin ?? false}
        displayName={user?.profile?.full_name ?? null}
        displayEmail={user?.email}
      />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
