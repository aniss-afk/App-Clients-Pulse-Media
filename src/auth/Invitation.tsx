import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Surligne } from '../ui/marque';
import { cn } from '../lib';
import {
  CONFIDENTIALITE,
  Invitation as Lien,
  activerInvitation,
  messageErreur,
  supabase,
  verifierInvitation,
} from './supabase';

/**
 * L'ouverture d'un espace marque, par le lien reçu en invitation.
 *
 * Le jeton fait office d'authentification : la personne n'a pas encore
 * de compte, c'est précisément ce que ce lien vient créer. Il est donc
 * vérifié avant d'afficher quoi que ce soit, et l'écran dit à qui il
 * appartient avant de demander un mot de passe. Un lien périmé ou déjà
 * utilisé le dit franchement plutôt que de laisser remplir un
 * formulaire pour rien.
 *
 * Le mot de passe est choisi ici et n'a jamais circulé par email.
 */
const champ =
  'w-full rounded-box border border-line-strong bg-paper px-4 py-3.5 text-md outline-none transition-colors focus:border-ink placeholder:text-ink-faint';

export function Invitation({ onEntre }: { onEntre: () => void }) {
  const { jeton = '' } = useParams();
  const [lien, setLien] = useState<Lien | null>(null);
  const [refus, setRefus] = useState<string | null>(null);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let vivant = true;
    verifierInvitation(jeton)
      .then((l) => vivant && setLien(l))
      .catch((e) => vivant && setRefus((e as Error).message));
    return () => {
      vivant = false;
    };
  }, [jeton]);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (motDePasse.length < 8) return setErreur('Choisis un mot de passe d’au moins 8 caractères.');
    /* La confirmation n'est pas du zèle : il n'y a pas d'ancien mot de
       passe à retenter si celui-ci part avec une faute de frappe. */
    if (confirmation !== motDePasse) return setErreur('Les deux mots de passe ne sont pas identiques.');

    setEnCours(true);
    try {
      const { email } = await activerInvitation(jeton, motDePasse);
      /* On enchaîne sur la connexion : demander de retaper ce qu'on
         vient de choisir, sur l'écran d'à côté, n'a aucun sens. */
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
      if (error) throw error;
      onEntre();
    } catch (err) {
      setErreur(messageErreur((err as Error).message));
      setEnCours(false);
    }
  }

  if (refus) {
    return (
      <Cadre>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-balance">Ce lien ne marche plus.</h1>
        <p className="mt-6 text-md leading-relaxed">{refus}</p>
        <p className="mt-4 text-base text-ink-muted leading-relaxed">
          Écris-nous et on t&apos;en renvoie un tout de suite.
        </p>
      </Cadre>
    );
  }

  if (!lien) {
    return (
      <div className="min-h-screen bg-cream grid place-items-center">
        <Loader2 className="w-5 h-5 animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <Cadre>
      <h1 className="text-3xl font-bold tracking-[-0.03em] text-balance">
        L&apos;espace de <Surligne>{lien.marque}</Surligne> t&apos;attend.
      </h1>
      <p className="mt-6 text-md leading-relaxed">
        Choisis ton mot de passe, et tu entres. Ton adresse est{' '}
        <span className="font-medium">{lien.email}</span>.
      </p>

      <form onSubmit={envoyer} className="mt-8 flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Ton mot de passe</span>
          <span className="relative block">
            <input
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => {
                setMotDePasse(e.target.value);
                setErreur(null);
              }}
              placeholder="8 caractères minimum"
              className={cn(champ, 'pr-12')}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-faint hover:text-ink transition-colors"
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Confirme-le</span>
          <input
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
              setErreur(null);
            }}
            placeholder="Le même, pour être sûr"
            className={champ}
          />
        </label>

        {erreur && (
          <p className="text-sm text-red-ink bg-red-pale rounded-box px-3.5 py-2.5" role="alert">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-pill bg-ink text-paper px-6 py-3.5 text-md font-medium transition-colors hover:bg-ink/90 disabled:opacity-40"
        >
          {enCours ? <><Loader2 className="w-4 h-4 animate-spin" /> Un instant…</> : 'Entrer dans mon espace'}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-faint">
        <a href={CONFIDENTIALITE} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-ink transition-colors">
          Politique de confidentialité
        </a>
      </p>
    </Cadre>
  );
}

function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream grid place-items-center px-5 py-10">
      <div className="w-full max-w-[470px]">
        <img src="/logo.webp" alt="Pulse Media" className="h-[30px] w-auto mb-9" />
        {children}
      </div>
    </div>
  );
}
