import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/types/database'

export type CurrentUser = {
  id: string
  email: string
  profile: Profile | null
  roles: UserRole[]
  isAdmin: boolean
}

/**
 * Reads the current user, profile, and role list from server components.
 * Returns null when nobody is signed in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', user.id),
  ])

  const roles: UserRole[] = (roleRows ?? []).map((r) => r.role as UserRole)

  return {
    id: user.id,
    email: user.email ?? '',
    profile: (profile as Profile | null) ?? null,
    roles,
    isAdmin: roles.includes('admin'),
  }
}
