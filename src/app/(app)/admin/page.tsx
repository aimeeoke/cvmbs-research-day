import Link from 'next/link'
import { FileText, Inbox, Leaf, ShieldCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const metadata = { title: 'Admin · CVMBS Research Day' }

export default async function AdminHome() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  // Committee members see the abstracts / names / certifications cards but
  // not the Role requests & withdrawals card. Layout has already gated so
  // user is non-null and has admin OR committee.
  const showRequestsCard = !!user?.isAdmin

  const [
    { count: pendingRoleRequests },
    { count: pendingWithdrawals },
    { count: totalSubmissions },
    { count: unlinkedAuthors },
    { count: pendingCerts },
  ] = await Promise.all([
    supabase
      .from('role_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .not('withdrawal_requested_at', 'is', null)
      .neq('status', 'withdrawn'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase
      .from('submission_authors')
      .select('id', { count: 'exact', head: true })
      .is('profile_id', null)
      .is('faculty_id', null)
      .not('display_name', 'is', null),
    supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .is('verified_at', null),
  ])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E4D2B] flex items-center gap-2">
          <ShieldCheck size={28} />
          Admin
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage abstracts, role requests, and withdrawals.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {showRequestsCard && (
          <AdminCard
            href="/admin/requests"
            icon={<Inbox size={22} />}
            title="Role requests & withdrawals"
            badge={
              (pendingRoleRequests ?? 0) + (pendingWithdrawals ?? 0) || undefined
            }
            hint={buildRequestsHint(pendingRoleRequests, pendingWithdrawals)}
          />
        )}
        <AdminCard
          href="/admin/abstracts"
          icon={<FileText size={22} />}
          title="Abstracts overview"
          badge={totalSubmissions ?? undefined}
          hint="Every submission across all statuses, filterable, with click-in view."
        />
        <AdminCard
          href="/admin/names"
          icon={<Users size={22} />}
          title="Author names"
          badge={unlinkedAuthors ?? undefined}
          hint="Unlinked hand-typed author names. Rename to fix misspellings and merge duplicates before points math runs."
        />
        <AdminCard
          href="/admin/certifications"
          icon={<Leaf size={22} />}
          title="Green Labs certifications"
          badge={pendingCerts ?? undefined}
          hint="Pending Ambassador and lab cert uploads. Approve to award points; deny to delete the file."
        />
      </div>
    </div>
  )
}

function buildRequestsHint(
  pendingRoleRequests: number | null,
  pendingWithdrawals: number | null
): string {
  const parts: string[] = []
  const r = pendingRoleRequests ?? 0
  const w = pendingWithdrawals ?? 0
  if (r) parts.push(`${r} pending role request${r === 1 ? '' : 's'}`)
  if (w)
    parts.push(`${w} pending withdrawal${w === 1 ? '' : 's'}`)
  if (parts.length === 0) return 'No pending items.'
  return parts.join(' · ')
}

function AdminCard({
  href,
  icon,
  title,
  badge,
  hint,
}: {
  href: string
  icon: React.ReactNode
  title: string
  badge?: number
  hint: string
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-[#1E4D2B]/40 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[#1E4D2B]">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {badge !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#1E4D2B] text-white text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mt-2">{hint}</p>
    </Link>
  )
}
