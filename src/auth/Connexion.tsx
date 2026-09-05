import { FormEvent, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Surligne } from '../ui/marque';
import { cn } from '../lib';
import { messageErreur, supabase } from './supabase';

/**
 * Entrer dans l'espace de sa marque.
 *
 * Un seul écran pour se connecter et pour créer son compte, comme dans
 * l'espace créateur : ce sont les deux faces du même geste, et deux
 * pages séparées obligent à deviner laquelle nous concerne. Créer un
 * compte n'ouvre rien par lui-même — c'est le rattachement à une
 * marque, posé par l'agence, qui ouvre l'espace.
 */
export function Connexion({ onEntre }: { onEntre: () => void }) {
  const [mode, setMode] = useState<'connexion' | 'creation'>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (mode === 'creation') {
      if (motDePasse.length < 8) {
        return setErreur('Choisissez un mot de passe d’au moins 8 caractères.');
      }
      /* La confirmation, seulement à la création : à la connexion on
         retape un mot de passe qu'on connaît déjà, et le redemander
         n'attrape aucune faute de frappe — le refus s'en charge. */
      if (confirmation !== motDePasse) {
        return setErreur('Les deux mots de passe ne sont pas identiques.');
      }
    }

    setEnCours(true);
    try {
      const { error } =
        mode === 'connexion'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse })
          : await supabase.auth.signUp({ email: email.trim(), password: motDePasse });
      if (error) throw error;
      onEntre();
    } catch (e) {
      setErreur(messageErreur((e as Error).message));
    } finally {
      setEnCours(false);
    }
  }

  const champ =
    'w-full rounded-box border border-line-strong bg-paper px-4 py-3.5 text-md outline-none transition-colors focus:border-ink placeholder:text-ink-faint';

  return (
    <div className="min-h-screen bg-cream grid place-items-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <img src="/logo.webp" alt="Pulse Media" className="h-[34px] w-auto mb-10" />

        <h1 className="text-3xl font-bold tracking-[-0.03em] text-balance">
          {mode === 'connexion' ? (
            <>L’espace de votre <Surligne>marque</Surligne>.</>
          ) : (
            <>Créez votre <Surligne>compte</Surligne>.</>
          )}
        </h1>
        <p className="mt-3 text-md text-ink-muted leading-relaxed">
          {mode === 'connexion'
            ? 'Vos performances, vos créations, ce qu’on fait sur votre compte.'
            : 'Utilisez l’adresse que vous nous avez donnée : on retrouvera votre marque.'}
        </p>

        <form onSubmit={envoyer} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Votre email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErreur(null); }}
              placeholder="vous@marque.fr"
              className={champ}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Mot de passe</span>
            <span className="flex items-center rounded-box border border-line-strong bg-paper transition-colors focus-within:border-ink">
              <input
                type={visible ? 'text' : 'password'}
                required
                autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                value={motDePasse}
                onChange={(e) => { setMotDePasse(e.target.value); setErreur(null); }}
                placeholder={mode === 'creation' ? '8 caractères minimum' : '••••••••'}
                className="w-full bg-transparent px-4 py-3.5 text-md outline-none placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="px-4 text-ink-faint hover:text-ink transition-colors"
                aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>

          {mode === 'creation' && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Confirmez le mot de passe</span>
              <input
                type={visible ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => { setConfirmation(e.target.value); setErreur(null); }}
                placeholder="Le même, pour être sûr"
                className={champ}
              />
            </label>
          )}

          {erreur && (
            <p className="text-sm text-red-ink bg-red-pale rounded-box px-3.5 py-2.5" role="alert">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3.5 text-md font-semibold text-paper transition-colors hover:bg-ink/90 disabled:opacity-40"
          >
            {enCours ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Un instant…</>
            ) : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted text-center">
          {mode === 'connexion' ? 'Pas encore de compte ?' : 'Vous en avez déjà un ?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'connexion' ? 'creation' : 'connexion');
              setConfirmation('');
              setErreur(null);
            }}
            className={cn('underline underline-offset-4 font-medium text-ink hover:text-red-ink transition-colors')}
          >
            {mode === 'connexion' ? 'Créez-le' : 'Connectez-vous'}
          </button>
        </p>
      </div>
    </div>
  );
}
