import { Clock, MapPin } from 'lucide-react'
import { scheduleData, type ScheduleEvent } from '@/lib/schedule'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Schedule · CVMBS Research Day',
}

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('events')
    .select('year, name, event_date')
    .eq('is_active', true)
    .maybeSingle()

  const dateLabel = event?.event_date
    ? new Date(event.event_date + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date TBD'

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1E4D2B]">
          {event?.name ?? 'CVMBS Research Day'}
        </h1>
        <p className="text-gray-600 mt-1">{dateLabel}</p>
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-4">
          Draft schedule — subject to change as sessions and speakers are confirmed.
        </p>
      </div>

      <div className="space-y-3">
        {scheduleData.map((event, i) => (
          <TimelineItem key={i} event={event} />
        ))}
      </div>
    </div>
  )
}

function TimelineItem({ event }: { event: ScheduleEvent }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center text-sm text-[#1E4D2B] font-bold mb-1">
        <Clock size={14} className="mr-1.5" />
        {event.time}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{event.title}</h3>
      {event.location && (
        <div className="flex items-center text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
          <MapPin size={12} className="mr-1 text-[#C8C372]" />
          {event.location}
        </div>
      )}
      {event.description && (
        <p className="text-sm text-gray-600 whitespace-pre-line mt-2 pl-3 border-l-2 border-gray-200">
          {event.description}
        </p>
      )}
    </div>
  )
}
