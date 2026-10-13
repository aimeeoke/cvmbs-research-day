import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted server code
 * (API routes for admin operations, seed scripts). Never call from a component.
 *
 * Reads from `researchday_secret_key` (Supabase's new named secret-key system,
 * replacing the deprecated SUPABASE_SERVICE_ROLE_KEY JWT). The lowercase name
 * is Supabase's naming constraint for named secret keys.
 */
export function createServiceRoleClient() {
  const secretKey = process.env.researchday_secret_key
  if (!secretKey) {
    throw new Error('researchday_secret_key is not set')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
