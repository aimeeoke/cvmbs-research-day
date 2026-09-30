'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export type AmbassadorRow = {
  id: string
  firstName: string
  lastName: string
  source: 'csv_import' | 'user_upload' | 'admin_manual'
}

/**
 * Client-side search + alphabetical group display.
 *
 * The dataset is small enough (hundreds, not thousands) to filter in memory
 * on every keystroke. We group by last-name initial so a browser-sized list
 * scans naturally on mobile — one tap to jump to "M", for example.
 */
export function GreenLabsClient({
  ambassadors,
}: {
  ambassadors: AmbassadorRow[]
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ambassadors
    return ambassadors.filter((a) => {
      const full = `${a.firstName} ${a.lastName}`.toLowerCase()
      return full.includes(q) || a.lastName.toLowerCase().includes(q)
    })
  }, [ambassadors, query])

  const groups = useMemo(() => {
    const byInitial = new Map<string, AmbassadorRow[]>()
    for (const a of filtered) {
      const initial = (a.lastName[0] ?? '#').toUpperCase()
      const key = /^[A-Z]$/.test(initial) ? initial : '#'
      const list = byInitial.get(key) ?? []
      list.push(a)
      byInitial.set(key, list)
    }
    return Array.from(byInitial.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4D2B] focus:border-[#1E4D2B]"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {ambassadors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
          No certified ambassadors listed yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
          No names match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
          {groups.map(([initial, list]) => (
            <div key={initial}>
              <div className="sticky top-0 z-10 bg-[#1E4D2B]/5 px-3 py-1.5 border-b border-gray-100 backdrop-blur">
                <span className="text-xs font-bold text-[#1E4D2B] uppercase tracking-wide">
                  {initial}
                </span>
              </div>
              <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-3">
                {list.map((a) => (
                  <li
                    key={a.id}
                    className="px-3 py-2 border-b border-gray-50 last:border-b-0 sm:border-b-0 sm:even:border-b-0 text-sm text-gray-800 flex items-baseline justify-between gap-2"
                  >
                    <span className="truncate">
                      {a.firstName} {a.lastName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
