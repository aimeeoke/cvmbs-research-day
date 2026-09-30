import { Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GreenLabsClient, type AmbassadorRow } from './green-labs-client'

export const metadata = { title: 'Green Labs · CVMBS Research Day' }

/**
 * Public directory of certified Green Labs ambassadors.
 *
 * No auth required — RLS on `certifications` is public read. Shows every
 * verified ambassador cert, sorted by last name. Search happens client-side
 * (small dataset, fits comfortably in memory).
 *
 * Data sources folded in the display:
 *   * CSV import — the pre-loaded My Green Lab ambassador list (name only)
 *   * User upload — someone uploaded their own certificate through the
 *     submit portal and admin verified it (includes email)
 *
 * We deliberately don't show emails on the public page. Admin sees them
 * internally, but this directory is name-only to match the CSV source.
 */
export default async function GreenLabsPage() {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from('certifications')
    .select('id, first_name, last_name, source, verified_at, valid_through')
    .eq('kind', 'ambassador')
    .not('verified_at', 'is', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-900 font-medium">
            Could not load the ambassador list.
          </p>
          <p className="text-sm text-red-800 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  const ambassadors: AmbassadorRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    firstName: (r.first_name as string | null) ?? '',
    lastName: (r.last_name as string | null) ?? '',
    source: r.source as AmbassadorRow['source'],
  }))

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-[#1E4D2B]/10 text-[#1E4D2B]">
          <Leaf size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1E4D2B]">Green Labs</h1>
          <p className="text-sm text-gray-600">
            CVMBS Research Day 2027 · My Green Lab Ambassadors
          </p>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          What is the Green Pipette?
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          The <strong>Green Pipette</strong> is a college-level Research Day
          award for the department that shows the strongest commitment to
          sustainability across the abstracts presented. Projects earn points
          two ways:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
          <li>
            <strong>10 points per certified ambassador</strong> on a project,
            up to a max of 100 pts per abstract. Complete the free{' '}
            <a
              href="https://mygreenlab.org/programs/ambassador-program/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
            >
              My Green Lab Ambassador Program
            </a>{' '}
            (self-paced, online, less than 3 hours).
          </li>
          <li>
            <strong>100 points</strong> if the work happened in a certified
            sustainable space — either{' '}
            <a
              href="https://mygreenlab.org/programs/mgl-certification/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
            >
              My Green Lab Certified
            </a>{' '}
            or{' '}
            <a
              href="https://www.veterinarysustainabilityalliance.org/clinic-certification"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E4D2B] font-semibold underline hover:text-[#163d22]"
            >
              Green Paw Certified
            </a>
            . Currency required as of December 31, 2026.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900">
            Certified ambassadors
          </h2>
          <p className="text-xs text-gray-500">
            {ambassadors.length.toLocaleString()} certified{' '}
            {ambassadors.length === 1 ? 'ambassador' : 'ambassadors'}
          </p>
        </div>
        <p className="text-sm text-gray-600">
          If you completed the training but don&apos;t see your name here,
          upload your certificate through the abstract submission portal —
          it&apos;ll be added after admin review. The list refreshes as
          new certifications are approved.
        </p>
        <GreenLabsClient ambassadors={ambassadors} />
      </section>
    </div>
  )
}
