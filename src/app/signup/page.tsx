'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, KeyRound, Loader2, Mail, User } from 'lucide-react'
import { isEmail, isFacultyEmail, normalizeEmail } from '@/lib/email'

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SignupContent />
    </Suspense>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-bold text-[#1E4D2B]">CVMBS Research Day</h1>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

type Kind = 'faculty' | 'other'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [kind, setKind] = useState<Kind>('other')
  const [email, setEmail] = useState('')

  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (codeSent && otpInputRef.current) otpInputRef.current.focus()
  }, [codeSent])

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Please enter your first name.'
    if (!lastName.trim()) return 'Please enter your last name.'
    if (!isEmail(email)) return 'Please enter a valid email address.'
    if (kind === 'faculty' && !isFacultyEmail(email)) {
      return 'CSU faculty must sign up with their first.last@colostate.edu address so Green Labs points credit to your record.'
    }
    return null
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setError(null)
    setIsLoading(true)

    const cleanEmail = normalizeEmail(email)
    const first = firstName.trim()
    const last = lastName.trim()

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: {
          first_name: first,
          last_name: last,
          full_name: `${first} ${last}`,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    setIsLoading(false)
    if (error) setError(error.message)
    else setCodeSent(true)
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
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizeEmail(email),
    })
    setIsLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1E4D2B]">CVMBS Research Day</h1>
          <p className="mt-2 text-sm text-gray-600">Create your account</p>
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
                <p className="mt-1 text-sm text-gray-500">
                  Check your email and enter the code below. Your account will be
                  created when you verify.
                </p>
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
                    setError(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Go back and edit details
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="first-name"
                      name="first-name"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      id="last-name"
                      name="last-name"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1E4D2B] focus:border-[#1E4D2B] sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-1">
                  I am a…
                </legend>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="kind"
                      value="other"
                      checked={kind === 'other'}
                      onChange={() => setKind('other')}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-800">
                      <span className="font-medium">Presenter, trainee, or non-faculty judge</span>
                      <span className="block text-xs text-gray-500">
                        Use whichever email you check most often — Gmail, personal, or CSU.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="kind"
                      value="faculty"
                      checked={kind === 'faculty'}
                      onChange={() => setKind('faculty')}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-800">
                      <span className="font-medium">CVMBS Faculty</span>
                      <span className="block text-xs text-gray-500">
                        Must use your <span className="font-mono">first.last@colostate.edu</span>{' '}
                        so Green Labs points credit correctly.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

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
                    placeholder={
                      kind === 'faculty' ? 'first.last@colostate.edu' : 'you@example.com'
                    }
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
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E4D2B] hover:bg-[#163d22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4D2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending code...
                  </>
                ) : (
                  'Create account & send code'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#1E4D2B] hover:text-[#163d22]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
