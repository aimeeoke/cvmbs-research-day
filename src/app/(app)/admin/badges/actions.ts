'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { ACHIEVEMENTS, type AchievementKey } from '@/lib/leaderboard/achievements-catalog'

export type OverrideAction = 'grant' | 'revoke'

/**
 * Writes a grant/revoke override for a (submission, badge) pair. Upserts on
 * the uniqueness constraint, so flipping an existing override is one call.
 * Passing action=null (or an empty string) deletes the override.
 */
export async function setBadgeOverride(formData: FormData) {
  const submissionId = String(formData.get('submission_id') ?? '')
  const badgeKey = String(formData.get('badge_key') ?? '')
  const rawAction = String(formData.get('action') ?? '')
  const reason = String(formData.get('reason') ?? '').trim() || null

  if (!submissionId) throw new Error('submission_id required')
  if (!badgeKey || !(badgeKey in ACHIEVEMENTS))
    throw new Error(`Unknown badge key: ${badgeKey}`)

  const user = await getCurrentUser()
  if (!user?.hasAdminAccess) throw new Error('Not authorized')

  const supabase = await createClient()

  if (rawAction === '' || rawAction === 'clear') {
    const { error } = await supabase
      .from('badge_overrides')
      .delete()
      .eq('submission_id', submissionId)
      .eq('badge_key', badgeKey)
    if (error) throw new Error(error.message)
  } else if (rawAction === 'grant' || rawAction === 'revoke') {
    const action: OverrideAction = rawAction
    const { error } = await supabase.from('badge_overrides').upsert(
      {
        submission_id: submissionId,
        badge_key: badgeKey,
        action,
        reason,
        admin_id: user.id,
      },
      { onConflict: 'submission_id,badge_key' }
    )
    if (error) throw new Error(error.message)
  } else {
    throw new Error(`Unknown action: ${rawAction}`)
  }

  revalidatePath(`/admin/badges/${submissionId}`)
  revalidatePath('/admin/badges')
  revalidatePath('/achievements')
}

export async function setBadgeOverrideFromKey(args: {
  submissionId: string
  badgeKey: AchievementKey
  action: OverrideAction | 'clear'
  reason?: string | null
}) {
  const fd = new FormData()
  fd.set('submission_id', args.submissionId)
  fd.set('badge_key', args.badgeKey)
  fd.set('action', args.action)
  if (args.reason) fd.set('reason', args.reason)
  await setBadgeOverride(fd)
}
