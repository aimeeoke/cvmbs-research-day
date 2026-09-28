import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { RoleRequestStatus, UserRole } from '@/lib/types/database'
import { RequestsClient } from './requests-client'

export const metadata = { title: 'Requests · Admin' }

export type RoleRequestRow = {
  id: string
  requested_role: UserRole
  note: string | null
  status: RoleRequestStatus
  created_at: string
  resolved_at: string | null
  user_id: string
  profile: {
    email: string | null
    full_name: string | null
    first_name: string | null
    last_name: string | null
  } | null
  currentRoles: UserRole[]
}

export type WithdrawalRow = {
  id: string
  title: string | null
  status: string
  withdrawal_requested_at: string
  withdrawal_requested_reason: string | null
  submitter_id: string
  submitter: {
    email: string | null
    full_name: string | null
  } | null
  presenter: {
    display_name: string | null
    email: string | null
  } | null
}

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  // Pending role requests + resolved history (last 20)
  const [
    { data: pendingRoleRaw, error: pendingErr },
    { data: recentResolvedRaw, error: resolvedErr },
    { data: pendingWithdrawalRaw, error: wErr },
  ] = await Promise.all([
    supabase
      .from('role_requests')
      .select(
        `id, requested_role, note, status, created_at, resolved_at, user_id,
         profiles!role_requests_user_id_fkey(email, full_name, first_name, last_name)`
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('role_requests')
      .select(
        `id, requested_role, note, status, created_at, resolved_at, user_id,
         profiles!role_requests_user_id_fkey(email, full_name, first_name, last_name)`
      )
      .neq('status', 'pending')
      .order('resolved_at', { ascending: false })
      .limit(20),
    supabase
      .from('submissions')
      .select(
        `id, title, status, withdrawal_requested_at, withdrawal_requested_reason,
         submitter_id,
         submitter:profiles!submissions_submitter_id_fkey(email, full_name),
         submission_authors(display_name, email, is_presenter)`
      )
      .not('withdrawal_requested_at', 'is', null)
      .neq('status', 'withdrawn')
      .order('withdrawal_requested_at', { ascending: true }),
  ])

  if (pendingErr || resolvedErr || wErr) {
    return (
      <ErrorFrame
        message={
          pendingErr?.message ?? resolvedErr?.message ?? wErr?.message ?? 'Load error'
        }
      />
    )
  }

  // Batch-fetch current roles for every user_id we display so we can show
  // "already has judge" style hints next to grant buttons.
  const userIds = new Set<string>([
    ...(pendingRoleRaw ?? []).map((r) => r.user_id),
    ...(recentResolvedRaw ?? []).map((r) => r.user_id),
  ])
  const rolesByUser = new Map<string, UserRole[]>()
  if (userIds.size > 0) {
    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', Array.from(userIds))
    for (const row of roleRows ?? []) {
      const list = rolesByUser.get(row.user_id) ?? []
      list.push(row.role as UserRole)
      rolesByUser.set(row.user_id, list)
    }
  }

  type RawRoleRow = {
    id: string
    requested_role: string
    note: string | null
    status: string
    created_at: string
    resolved_at: string | null
    user_id: string
    profiles:
      | RoleRequestRow['profile']
      | RoleRequestRow['profile'][]
      | null
  }

  const shapeRoleRequest = (r: RawRoleRow): RoleRequestRow => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles
    return {
      id: r.id,
      requested_role: r.requested_role as UserRole,
      note: r.note,
      status: r.status as RoleRequestStatus,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      user_id: r.user_id,
      profile,
      currentRoles: rolesByUser.get(r.user_id) ?? [],
    }
  }

  const pendingRoles = ((pendingRoleRaw ?? []) as unknown as RawRoleRow[]).map(
    shapeRoleRequest
  )
  const recentResolved = (
    (recentResolvedRaw ?? []) as unknown as RawRoleRow[]
  ).map(shapeRoleRequest)

  type RawWithdrawalRow = {
    id: string
    title: string | null
    status: string
    withdrawal_requested_at: string
    withdrawal_requested_reason: string | null
    submitter_id: string
    // Supabase returns FK-joined rows as arrays even when the join is 1:1.
    submitter: { email: string | null; full_name: string | null }[] | null
    submission_authors:
      | {
          display_name: string | null
          email: string | null
          is_presenter: boolean
        }[]
      | null
  }

  const pendingWithdrawals: WithdrawalRow[] = (
    (pendingWithdrawalRaw ?? []) as unknown as RawWithdrawalRow[]
  ).map((row) => {
    const authors = row.submission_authors ?? []
    const presenter = authors.find((a) => a.is_presenter) ?? null
    const submitter = row.submitter?.[0] ?? null
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      withdrawal_requested_at: row.withdrawal_requested_at,
      withdrawal_requested_reason: row.withdrawal_requested_reason,
      submitter_id: row.submitter_id,
      submitter,
      presenter: presenter
        ? { display_name: presenter.display_name, email: presenter.email }
        : null,
    }
  })

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-[#1E4D2B] mt-1 flex items-center gap-2">
          <Inbox size={26} />
          Requests
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Role requests from users who want mentor, judge, admin, or volunteer
          access; and abstract withdrawal requests from submitters.
        </p>
      </div>

      <RequestsClient
        pendingRoles={pendingRoles}
        recentResolved={recentResolved}
        pendingWithdrawals={pendingWithdrawals}
      />
    </div>
  )
}

function ErrorFrame({ message }: { message: string }) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-900 font-medium">Could not load requests.</p>
        <p className="text-sm text-red-800 mt-1">{message}</p>
      </div>
    </div>
  )
}
