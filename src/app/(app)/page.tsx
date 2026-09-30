import Link from 'next/link'
import { BookOpen, Calendar, FileText, Info, LogIn, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export default async function Home() {
  const user = await getCurrentUser()
  const supabase = await createClient()

  // Set NEXT_PUBLIC_SUBMISSION_GUIDELINES_URL in Vercel (and .env.local) to a
  // public URL for the guidelines PDF. Hidden here until that env var exists.
  const guidelinesUrl = process.env.NEXT_PUBLIC_SUBMISSION_GUIDELINES_URL

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
        <p className="text-gray-700 mt-1">
          {dateLabel ?? 'Saturday, January 23, 2027'}
        </p>
        <p className="text-gray-600 mt-0.5 flex items-center gap-1.5">
          <MapPin size={14} className="text-[#C8C372]" />
          Translational Medicine Institute
        </p>
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
          {guidelinesUrl && (
            <a
              href={guidelinesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50"
            >
              <BookOpen size={16} />
              Submission guidelines (PDF)
            </a>
          )}
        </div>
      </section>

      {guidelinesUrl && (
        <section className="bg-[#1E4D2B]/5 border border-[#1E4D2B]/20 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <BookOpen size={20} className="text-[#1E4D2B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1E4D2B]">
                Read the abstract submission guidelines
              </h2>
              <p className="text-sm text-gray-700 mt-1">
                Formatting rules, author conventions, and what reviewers look for.
                Please review before you start a submission — it saves everyone
                revisions later.
              </p>
              <a
                href={guidelinesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1E4D2B] hover:text-[#163d22] underline"
              >
                Open guidelines PDF →
              </a>
            </div>
          </div>
        </section>
      )}

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
  // Event deadlines are stored as full timestamps (11:59pm MST). Vercel's
  // Node runtime defaults to UTC, so without an explicit timeZone the
  // formatter shifts the date forward by a day (e.g. Nov 16 → Nov 17).
  // Always render event dates in the event's own timezone.
  const text = when
    ? new Date(when).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/Denver',
      })
    : fallback
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mt-1">{text}</div>
    </div>
  )
}
