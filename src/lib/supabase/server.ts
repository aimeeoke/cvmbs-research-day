import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server Supabase client. Use in Server Components, Server Actions, and route handlers.
 * Reads/writes the user session through Next's cookie store.
 *
 * Note: untyped for now — see client.ts for the plan to add generated types.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can't write cookies. Middleware refreshes sessions instead.
          }
        },
      },
    }
  )
}
