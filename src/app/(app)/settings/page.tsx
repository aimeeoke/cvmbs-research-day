import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Settings · CVMBS Research Day' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/settings')

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-3xl font-bold text-[#1E4D2B]">Settings</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-900 text-sm">
        Password change and role request form are being built. Come back soon.
      </div>
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-1">
        <div className="text-xs uppercase tracking-wide text-gray-500">Signed in as</div>
        <div className="text-gray-900 font-medium">
          {user.profile?.full_name || 'No name set'}
        </div>
        <div className="text-sm text-gray-600">{user.email}</div>
        {user.roles.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1">
            {user.roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1E4D2B]/10 text-[#1E4D2B]"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
