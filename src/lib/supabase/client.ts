import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client. Use inside 'use client' components.
 *
 * Note: untyped for now. Once we're wired to the Supabase CLI we'll swap in
 * generated `Database` types via `createBrowserClient<Database>`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
