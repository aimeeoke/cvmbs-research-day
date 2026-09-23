'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutPage() {
  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {
        // localStorage can be unavailable in some browser modes; safe to ignore.
      }
      window.location.href = '/'
    }
    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-700">Signing out…</p>
    </div>
  )
}
