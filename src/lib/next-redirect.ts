// Duck-type check for the sentinel error that `redirect()` throws from
// server actions. Next tags these errors with a `digest` starting with
// `NEXT_REDIRECT` so the framework can propagate the navigation; any
// client-side try/catch around a server action that may redirect MUST
// re-throw the sentinel or the redirect never happens and the user sees
// "NEXT_REDIRECT" in their error UI for a moment before the eventual
// navigation.
//
// Next exports `isRedirectError` only from an internal path
// (`next/dist/client/components/redirect-error`) — not stable across
// upgrades, so we check the shape ourselves instead.
export function isNextRedirectError(e: unknown): boolean {
  if (e === null || typeof e !== 'object') return false
  const digest = (e as { digest?: unknown }).digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}
