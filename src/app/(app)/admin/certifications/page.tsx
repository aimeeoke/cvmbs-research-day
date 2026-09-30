import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCertificationPublicUrl } from '@/lib/storage'
import { CertificationsClient, type CertRow } from './certifications-client'

export const metadata = { title: 'Certifications · Admin' }

/**
 * Admin verification tool for Green Labs certifications.
 *
 * Two tabs:
 *   * Pending — every cert with verified_at IS NULL. Each row shows the
 *     subject (name + email), source, uploader, upload date, and a link to
 *     preview the PDF (or image) in a new tab. Approve stamps verified_at;
 *     Deny wipes the row + file.
 *   * Verified (recent) — the most recent 50 verified certs, in case admin
 *     needs to undo an approval or spot-check what they've approved lately.
 *
 * Query strategy: fetch cert rows in one pass, then hydrate uploader names
 * from the profiles table in a second pass. Two round-trips, no JOIN — same
 * shape as the /admin/requests page. Fine at this scale.
 */
export default async function AdminCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab: 'pending' | 'verified' = tab === 'verified' ? 'verified' : 'pending'

  const supabase = await createClient()

  const pendingQuery = supabase
    .from('certifications')
    .select(
      'id, kind, source, storage_path, first_name, last_name, email, faculty_id, lab_name, uploaded_at, uploaded_by, verified_at'
    )
    .is('verified_at', null)
    .order('uploaded_at', { ascending: false })

  const verifiedQuery = supabase
    .from('certifications')
    .select(
      'id, kind, source, storage_path, first_name, last_name, email, faculty_id, lab_name, uploaded_at, uploaded_by, verified_at, verified_by'
    )
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })
    .limit(50)

  const [{ data: pending }, { data: verified }, { count: pendingCount }] =
    await Promise.all([
      pendingQuery,
      verifiedQuery,
      supabase
        .from('certifications')
        .select('id', { count: 'exact', head: true })
        .is('verified_at', null),
    ])

  const rows = activeTab === 'verified' ? verified ?? [] : pending ?? []

  // Hydrate uploader/verifier profile info in one round-trip.
  const profileIds = new Set<string>()
  for (const r of rows) {
    if (r.uploaded_by) profileIds.add(r.uploaded_by as string)
    if ('verified_by' in r && r.verified_by) profileIds.add(r.verified_by as string)
  }
  let profileById: Map<string, { name: string; email: string | null }> = new Map()
  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, email')
      .in('id', Array.from(profileIds))
    profileById = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          name:
            (p.full_name as string | null) ||
            [p.first_name, p.last_name].filter(Boolean).join(' ') ||
            (p.email as string) ||
            '(unknown)',
          email: (p.email as string | null) ?? null,
        },
      ])
    )
  }

  const certRows: CertRow[] = rows.map((r) => {
    const uploader = r.uploaded_by
      ? profileById.get(r.uploaded_by as string) ?? null
      : null
    const verifier =
      'verified_by' in r && r.verified_by
        ? profileById.get(r.verified_by as string) ?? null
        : null
    const path = (r.storage_path as string | null) ?? null
    return {
      id: r.id as string,
      kind: r.kind as CertRow['kind'],
      source: r.source as CertRow['source'],
      subjectName:
        [r.first_name, r.last_name].filter(Boolean).join(' ') ||
        (r.lab_name as string | null) ||
        '(unnamed)',
      subjectEmail: (r.email as string | null) ?? null,
      labName: (r.lab_name as string | null) ?? null,
      storagePath: path,
      fileUrl: path ? getCertificationPublicUrl(supabase, path) : null,
      uploadedAt: r.uploaded_at as string,
      uploaderName: uploader?.name ?? null,
      uploaderEmail: uploader?.email ?? null,
      verifiedAt: (r.verified_at as string | null) ?? null,
      verifierName: verifier?.name ?? null,
    }
  })

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          ← Back to admin
        </Link>
        <h1 className="text-3xl font-bold text-[#1E4D2B] mt-2">
          Certifications
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Review Green Labs certification uploads. Approve to award points;
          deny to delete the row and file (the person can re-upload after).
        </p>
      </div>

      <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-sm">
        <TabLink
          href="/admin/certifications"
          active={activeTab === 'pending'}
        >
          Pending{' '}
          {pendingCount !== null && pendingCount !== undefined && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </TabLink>
        <TabLink
          href="/admin/certifications?tab=verified"
          active={activeTab === 'verified'}
        >
          Recently verified
        </TabLink>
      </div>

      <CertificationsClient
        rows={certRows}
        mode={activeTab}
      />
    </div>
  )
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 border-l first:border-l-0 border-gray-200 ${
        active
          ? 'bg-[#1E4D2B] text-white font-semibold'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}
