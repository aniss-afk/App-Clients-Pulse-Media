import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Surligne } from '../ui/marque';
import { Moi, deconnecter, moi, supabase } from './supabase';
import { Connexion } from './Connexion';

/**
 * La porte de l'espace marque.
 *
 * Avoir un compte n'ouvre rien : c'est le rattachement à une marque
 * qui décide, et il vient de la base. Un compte créé sans rattachement
 * tombe sur l'écran d'attente plutôt que sur un tableau de bord vide —
 * une marque qui verrait des zéros partout croirait que la campagne ne
 * produit rien.
 */
const Contexte = createContext<Moi | null>(null);

/** L'identité du compte connecté. Nulle hors de la porte. */
export const useMoi = () => useContext(Contexte);

export function Porte({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<boolean | null>(null);
  const [profil, setProfil] = useState<Moi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const relire = useCallback(async () => {
    try {
      setProfil(await moi());
      setErreur(null);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(Boolean(data.session));
      if (data.session) void relire();
    });
    const { data: ecoute } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(Boolean(s));
      if (s) void relire();
      else setProfil(null);
    });
    return () => ecoute.subscription.unsubscribe();
  }, [relire]);

  if (session === null) return <Attente />;
  if (!session) return <Connexion onEntre={() => void relire()} />;
  if (erreur) return <Message titre="Quelque chose cloche" texte={erreur} />;
  if (!profil) return <Attente />;

  if (!profil.clientId) {
    return (
      <Message
        titre={<>On prépare <Surligne>votre espace</Surligne>.</>}
        texte="Votre compte est créé, mais il n'est pas encore rattaché à une marque. C'est l'agence qui fait ce rattachement, et vous recevrez un email dès qu'il est en place."
        secondaire="Si vous pensez que c'est une erreur, répondez au dernier email qu'on vous a envoyé : on regarde tout de suite."
      />
    );
  }

  return <Contexte.Provider value={profil}>{children}</Contexte.Provider>;
}

function Attente() {
  return (
    <div className="min-h-screen bg-cream grid place-items-center">
      <Loader2 className="w-5 h-5 animate-spin text-ink-faint" />
    </div>
  );
}

function Message({
  titre,
  texte,
  secondaire,
}: {
  titre: ReactNode;
  texte: string;
  secondaire?: string;
}) {
  return (
    <div className="min-h-screen bg-cream grid place-items-center px-5 py-10">
      <div className="w-full max-w-[470px]">
        <img src="/logo.webp" alt="Pulse Media" className="h-[30px] w-auto mb-9" />
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-balance">{titre}</h1>
        <p className="mt-6 text-md leading-relaxed">{texte}</p>
        {secondaire && <p className="mt-4 text-base text-ink-muted leading-relaxed">{secondaire}</p>}
        <button
          type="button"
          onClick={() => void deconnecter()}
          className="mt-9 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <LogOut className="w-4 h-4" /> Se déconnecter
        </button>
      </div>
    </div>
  );
}
