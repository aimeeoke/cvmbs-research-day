'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  renderedAt: string
  intervalSeconds?: number
}

/**
 * Shows "Last updated {clock time} · refreshes every N seconds" and triggers
 * a server-component refresh every N seconds via router.refresh().
 *
 * The render timestamp is passed in from the server to avoid hydration
 * mismatches (the client formats the Date for display only).
 */
export default function AutoRefresh({ renderedAt, intervalSeconds = 60 }: Props) {
  const router = useRouter()
  const [label, setLabel] = useState('')

  useEffect(() => {
    const d = new Date(renderedAt)
    const fmt = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setLabel(fmt)
  }, [renderedAt])

  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalSeconds * 1000)
    return () => clearInterval(t)
  }, [router, intervalSeconds])

  return (
    <p className="font-mono text-xs text-gray-500">
      {label ? `Last updated ${label}` : 'Last updated —'} · refreshes every {intervalSeconds} seconds
    </p>
  )
}
