import Link from 'next/link'
import { Calendar, FileText, Info, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('year, name, event_date, submission_closes_at, finalize_deadline_at')
    .eq('is_active', true)
    .maybeSingle()

  let myAbstractCount = 0
  if (user) {
    const { count } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
    myAbstractCount = count ?? 0
  }

  const dateLabel = event?.event_date
    ? new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E4D2B]">
          {event?.name ?? 'CVMBS Research Day'}
        </h1>
        {dateLabel && <p className="text-gray-700 mt-1">{dateLabel}</p>}
        <p className="text-gray-600 mt-3 max-w-2xl">
          The annual showcase of research from the College of Veterinary Medicine and
          Biomedical Sciences. Submit your abstract, explore the schedule, and get ready
          for the big day.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link
              href="/abstracts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
            >
              <FileText size={16} />
              {myAbstractCount > 0 ? 'Open abstract portal' : 'Start a submission'}
            </Link>
          ) : (
            <Link
              href="/login?redirect=/abstracts"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E4D2B] text-white text-sm font-semibold hover:bg-[#163d22]"
            >
              <LogIn size={16} />
              Sign in to submit
            </Link>
          )}
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
          >
            <Calendar size={16} />
            View schedule
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
          >
            <Info size={16} />
            About
          </Link>
        </div>
      </section>

      {user && myAbstractCount > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Your abstracts
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-0.5">
                {myAbstractCount} {myAbstractCount === 1 ? 'submission' : 'submissions'}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                View, edit, or start a new one from the Abstract Portal.
              </div>
            </div>
            <Link
              href="/abstracts"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[#1E4D2B] text-[#1E4D2B] text-sm font-semibold hover:bg-[#1E4D2B]/5"
            >
              Open portal
            </Link>
          </div>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <Deadline
          label="New submissions close"
          when={event?.submission_closes_at ?? null}
          fallback="Date TBD"
        />
        <Deadline
          label="Final edits due"
          when={event?.finalize_deadline_at ?? null}
          fallback="Date TBD"
        />
      </section>
    </div>
  )
}

function Deadline({
  label,
  when,
  fallback,
}: {
  label: string
  when: string | null
  fallback: string
}) {
  const text = when
    ? new Date(when).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : fallback
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mt-1">{text}</div>
    </div>
  )
}
