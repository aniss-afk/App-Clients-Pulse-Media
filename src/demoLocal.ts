/** Le mode simulé ne peut jamais pointer vers un projet Supabase distant. */
export function configurationDemoLocale(env: { VITE_PULSE_DEMO?: string; VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string }) {
  if (env.VITE_PULSE_DEMO !== 'true') return null;
  let url: URL;
  try { url = new URL(env.VITE_SUPABASE_URL ?? ''); } catch { throw new Error('Mode démo : renseignez l’adresse du serveur local.'); }
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('Mode démo bloqué : seule une URL HTTP localhost ou 127.0.0.1 est autorisée.');
  }
  return { url: url.origin, cle: env.VITE_SUPABASE_ANON_KEY || 'pulse-demo-local' };
}
