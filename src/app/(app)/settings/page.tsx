import { redirect } from 'next/navigation'
import { KeyRound, ShieldCheck, User as UserIcon, Clock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { UserRole, RoleRequestStatus } from '@/lib/types/database'
import { PasswordForm } from './password-form'
import { RoleRequestForm } from './role-request-form'

export const metadata = { title: 'Settings · CVMBS Research Day' }

const STATUS_STYLES: Record<RoleRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  granted: 'bg-green-100 text-green-900',
  denied: 'bg-red-100 text-red-900',
  resolved: 'bg-gray-100 text-gray-800',
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/settings')

  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('role_requests')
    .select('id, requested_role, note, status, created_at, resolved_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const pendingRoles: UserRole[] = (requests ?? [])
    .filter((r) => r.status === 'pending')
    .map((r) => r.requested_role as UserRole)

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-3xl font-bold text-[#1E4D2B]">Settings</h1>

      <Section icon={<UserIcon size={22} />} title="Account">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Signed in as</div>
          <div className="text-gray-900 font-medium">
            {user.profile?.full_name || 'No name set'}
          </div>
          <div className="text-sm text-gray-600">{user.email}</div>
        </div>
        {user.roles.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Current roles
            </div>
            <div className="flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1E4D2B]/10 text-[#1E4D2B]"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section icon={<KeyRound size={22} />} title="Password">
        <PasswordForm />
      </Section>

      <Section icon={<ShieldCheck size={22} />} title="Request a role">
        <RoleRequestForm
          currentRoles={user.roles}
          pendingRoles={pendingRoles}
        />
      </Section>

      {requests && requests.length > 0 && (
        <Section icon={<Clock size={22} />} title="Your role requests">
          <ul className="divide-y divide-gray-200">
            {requests.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {r.requested_role}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[r.status as RoleRequestStatus]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at ?? '').toLocaleDateString()}
                  </span>
                </div>
                {r.note && (
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{r.note}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-[#1E4D2B]">{icon}</div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-4 space-y-4 text-gray-700 text-sm sm:text-base">{children}</div>
    </div>
  )
}
