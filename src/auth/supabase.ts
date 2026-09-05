import { createClient } from '@supabase/supabase-js';

/**
 * Le client Supabase de l'espace marque.
 *
 * Même projet que l'espace créateur et que l'espace de gestion : une
 * seule base, une seule table d'identités (`profiles`), un seul jeu de
 * politiques. Ce qu'une marque a le droit de lire est décidé en SQL
 * par `mon_client_id()`, jamais ici — la clé anonyme est publiable par
 * conception, et une requête faite depuis la console du navigateur ne
 * rapporte rien de plus que l'application.
 */
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://cnyjtqbjzzgblmxqcbzw.supabase.co';
const CLE =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueWp0cWJqenpnYmxteHFjYnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODExNzEsImV4cCI6MjEwMzk1NzE3MX0.HyI9zHRWAIz0mR12B3-H2jhOCEhafSzYMQfwaGAWlMQ';

export const supabase = createClient(URL, CLE, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface Moi {
  id: string;
  email: string;
  nom: string | null;
  role: string | null;
  clientId: string | null;
  /** Le nom de la marque, quand le compte est rattaché à une. */
  marque: string | null;
}

/**
 * Qui est connecté, et à quelle marque.
 *
 * On ne se fie pas au rôle : le déclencheur d'inscription pose
 * `client` sur tout nouveau compte, y compris celui d'un créateur.
 * Ce qui ouvre l'espace, c'est le rattachement à une marque —
 * `client_id` — posé par l'agence.
 */
export async function moi(): Promise<Moi | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, nom, role, client_id')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error) throw error;

  const clientId = data?.client_id ?? null;
  let marque: string | null = null;
  if (clientId) {
    const { data: c } = await supabase.from('clients').select('nom').eq('id', clientId).maybeSingle();
    marque = c?.nom ?? null;
  }

  return {
    id: session.user.id,
    email: data?.email ?? session.user.email ?? '',
    nom: data?.nom ?? null,
    role: data?.role ?? null,
    clientId,
    marque,
  };
}

/** Traduit les erreurs de Supabase en phrases qu'on peut lire. */
export function messageErreur(brut: string): string {
  const t = brut.toLowerCase();
  if (t.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (t.includes('user already registered')) return 'Un compte existe déjà avec cette adresse. Connectez-vous.';
  if (t.includes('password should be at least')) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (t.includes('unable to validate email')) return "Cette adresse n'a pas l'air valide.";
  if (t.includes('rate limit') || t.includes('too many')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  return brut;
}
