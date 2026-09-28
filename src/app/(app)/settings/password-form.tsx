'use client'

import { useState } from 'react'
import { Loader2, Lock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setIsSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setPassword('')
    setConfirm('')
    setSuccess(true)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-gray-600">
        Set or replace the password for your account. You can then sign in with{' '}
        <strong>either</strong> your password or an emailed code.
      </p>

      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
          New password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
            placeholder="At least 8 characters"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
          Confirm new password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
            placeholder="Type it again"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Password saved. You can now sign in with it.
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving || !password || !confirm}
        className="inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E4D2B] hover:bg-[#163d22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Saving...
          </>
        ) : (
          'Save password'
        )}
      </button>
    </form>
  )
}
