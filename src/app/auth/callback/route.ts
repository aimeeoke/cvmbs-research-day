import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback for email magic links.
 *
 * Two-click flow (SafeLinks defeat): the first hit renders a plain HTML page
 * with a button. Microsoft SafeLinks/Outlook prefetches the URL to scan it,
 * which used to consume the one-time code before the user clicked. Now the
 * exchange only happens on the second hit (?confirm=1).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const confirm = searchParams.get('confirm')

  const supabase = await createClient()

  if (code) {
    if (confirm !== '1') {
      const confirmUrl = `${origin}/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}&confirm=1`
      return new Response(renderConfirmationPage(confirmUrl), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)

    console.error('Code exchange error:', error)
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  if (tokenHash && type === 'magiclink') {
    if (confirm !== '1') {
      const confirmUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}&confirm=1`
      return new Response(renderConfirmationPage(confirmUrl), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })
    if (!error) return NextResponse.redirect(`${origin}${next}`)

    console.error('Token verification error:', error)
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

function renderConfirmationPage(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Login · CVMBS Research Day</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F8F9FA; min-height: 100vh;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .container {
      background: white; border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      border: 1px solid #E5E7EB; padding: 2.5rem; max-width: 420px; width: 100%; text-align: center;
    }
    .logo {
      width: 56px; height: 56px; background-color: #1E4D2B; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;
      color: white; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;
    }
    h1 { color: #1E4D2B; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
    .subtitle { color: #374151; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .description { color: #6B7280; margin-bottom: 1.75rem; line-height: 1.6; font-size: 0.9375rem; }
    .button {
      display: inline-block; background-color: #1E4D2B; color: white;
      padding: 0.875rem 2.5rem; border-radius: 8px; text-decoration: none;
      font-weight: 600; font-size: 1rem; transition: background-color 0.2s;
    }
    .button:hover { background-color: #163d22; }
    .security-note {
      margin-top: 1.75rem; padding: 0.875rem; background-color: #F0FDF4;
      border: 1px solid #BBF7D0; border-radius: 8px;
      font-size: 0.8125rem; color: #166534;
    }
    .footer { margin-top: 1.5rem; font-size: 0.8125rem; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">CVMBS</div>
    <h1>Complete Your Login</h1>
    <p class="subtitle">CVMBS Research Day</p>
    <p class="description">You're almost there. Click the button below to finish signing in.</p>
    <a href="${confirmUrl}" class="button">Complete Login</a>
    <div class="security-note">
      <strong>Why this extra step?</strong><br>
      CSU email security scans links before you click them. This page ensures your login link works properly.
    </div>
    <p class="footer">Colorado State University · CVMBS</p>
  </div>
</body>
</html>`
}
