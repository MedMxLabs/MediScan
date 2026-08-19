/** Send OAuth ?code=... to /auth/callback when Supabase lands on the wrong path. */
export function redirectOAuthCodeToCallback() {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname || '';
  if (path === '/auth/callback' || path === '/reset-password') return;

  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const hasCode = search.includes('code=') || hash.includes('access_token=');
  const hasError = search.includes('error=') || hash.includes('error=');

  if (!hasCode || hasError) return;

  const target = `/auth/callback${search}${hash}`;
  window.location.replace(target);
}
