'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, CheckCircle, KeyRound } from 'lucide-react'
import { normalizeEmail } from '@/lib/email'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  link_expired: 'Your login code has expired or was already used. Please request a new one.',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#1E4D2B]">CVMBS Research Day</h1>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError && ERROR_MESSAGES[urlError]) {
      setError(ERROR_MESSAGES[urlError])
    }
  }, [searchParams])

  useEffect(() => {
    if (codeSent && otpInputRef.current) otpInputRef.current.focus()
  }, [codeSent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const cleanEmail = normalizeEmail(email)

    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      setIsLoading(false)
      if (error) {
        setError(
          error.message.includes('Invalid login credentials')
            ? 'Invalid email or password. Please try again.'
            : error.message
        )
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail })
      setIsLoading(false)
      if (error) setError(error.message)
      else setCodeSent(true)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: otpCode,
      type: 'email',
    })
    setIsVerifying(false)

    if (error) {
      if (error.message.toLowerCase().includes('expired')) {
        setError('That code has expired. Please request a new one.')
      } else if (error.message.toLowerCase().includes('invalid')) {
        setError('Invalid code. Please check and try again.')
      } else {
        setError(error.message)
      }
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)
    setOtpCode('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email: normalizeEmail(email) })

    setIsLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E4D2B]">CVMBS Research Day</h1>
          <p className="mt-2 text-sm text-gray-600">Abstract Submission &amp; Scoring</p>
          <p className="text-sm text-gray-500">Colorado State University · CVMBS</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {codeSent ? (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">Enter your login code</h2>
                <p className="mt-2 text-sm text-gray-600">
                  We sent a code to <strong>{email}</strong>
                </p>
                <p className="mt-1 text-sm text-gray-500">Check your email and enter the code below.</p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
                    Login code
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp-code"
                      ref={otpInputRef}
                      name="otp-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={8}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] text-center text-2xl tracking-[0.3em] font-mono"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !otpCode}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E4D2B] hover:bg-[#163d22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>

              <div className="mt-4 flex flex-col items-center space-y-2">
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-sm text-[#1E4D2B] hover:text-[#163d22] font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Resend code'}
                </button>
                <button
                  onClick={() => {
                    setCodeSent(false)
                    setOtpCode('')
                    setEmail('')
                    setPassword('')
                    setError(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 text-center">
                  Sign in to your account
                </h2>
                <p className="mt-1 text-sm text-gray-500 text-center">
                  Enter your password, or leave blank for an email code
                </p>
              </div>

              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  <strong className="text-amber-900">CVMBS Faculty:</strong> sign in with
                  your <span className="font-mono">first.last@colostate.edu</span> alias so
                  Green Labs points credit to your record. Everyone else, use whichever
                  email you registered with.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
                      placeholder="first.last@colostate.edu"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
                      placeholder="Leave blank for email code"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E4D2B] hover:bg-[#163d22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      {password ? 'Signing in...' : 'Sending code...'}
                    </>
                  ) : password ? (
                    'Sign In'
                  ) : (
                    'Send Login Code'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-[#1E4D2B] hover:text-[#163d22]">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-500">
          Most people sign in with an emailed code. Support staff can enter a password to
          sign in immediately.
        </p>
      </div>
    </div>
  )
}
