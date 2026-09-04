import { ReactNode, useEffect } from 'react';
import { cn } from '../lib';
import { Bouton } from './pieces';

/**
 * Panneau latéral de saisie.
 *
 * Plutôt qu'une fenêtre modale au centre : ce qu'on remplit ici se lit
 * en regard de ce qu'on vient de quitter — on refuse une création en
 * la voyant encore. Une modale centrée cache précisément ce à quoi on
 * compare.
 */
export function Panneau({
  titre,
  sous,
  ouvert,
  onFermer,
  onValider,
  valider = 'Enregistrer',
  enCours,
  children,
}: {
  titre: string;
  sous?: string;
  ouvert: boolean;
  onFermer: () => void;
  onValider: () => void;
  valider?: string;
  enCours?: boolean;
  children: ReactNode;
}) {
  /* Échappement pour fermer, et le fond ne défile plus : un panneau
     ouvert au-dessus d'une liste qui bouge derrière donne le vertige. */
  useEffect(() => {
    if (!ouvert) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    document.addEventListener('keydown', auClavier);
    const avant = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', auClavier);
      document.body.style.overflow = avant;
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[var(--overlay)]" onClick={onFermer} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="relative w-full max-w-md bg-paper border-l border-line h-full overflow-y-auto flex flex-col"
      >
        <div className="px-6 pt-7 pb-5 border-b border-line">
          <h2 className="text-lg font-bold tracking-[-0.015em]">{titre}</h2>
          {sous && <p className="mt-1.5 text-sm text-ink-muted">{sous}</p>}
        </div>

        <form
          className="px-6 py-6 flex flex-col gap-5 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            onValider();
          }}
        >
          {children}
          <div className="mt-auto pt-6 flex items-center gap-2">
            <Bouton type="submit" ton="accent" disabled={enCours}>
              {enCours ? 'Enregistrement…' : valider}
            </Bouton>
            <Bouton onClick={onFermer}>Annuler</Bouton>
          </div>
        </form>
      </div>
    </div>
  );
}

function Enveloppe({
  label,
  aide,
  faute,
  children,
}: {
  label: string;
  aide?: string;
  faute?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-micro font-semibold uppercase text-ink-faint">{label}</span>
      {children}
      {faute ? (
        <span className="text-xs text-red-ink">{faute}</span>
      ) : (
        aide && <span className="text-xs text-ink-faint">{aide}</span>
      )}
    </label>
  );
}

const styleChamp =
  'w-full bg-inset text-ink border border-line rounded-box px-3.5 py-2.5 text-md placeholder:text-ink-faint outline-none transition-colors focus:border-ink/40 focus:bg-paper';

export function Champ({
  label,
  valeur,
  onChange,
  placeholder,
  type = 'text',
  aide,
  faute,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  aide?: string;
  faute?: string;
}) {
  return (
    <Enveloppe label={label} aide={aide} faute={faute}>
      <input
        type={type}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(styleChamp, faute && 'border-red-soft')}
      />
    </Enveloppe>
  );
}

/** Champ multiligne, pour ce qui ne tient pas sur une ligne. */
export function Texte({
  label,
  valeur,
  onChange,
  placeholder,
  lignes = 4,
  aide,
  faute,
}: {
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder?: string;
  lignes?: number;
  aide?: string;
  faute?: string;
}) {
  return (
    <Enveloppe label={label} aide={aide} faute={faute}>
      <textarea
        rows={lignes}
        value={valeur}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(styleChamp, 'leading-relaxed', faute && 'border-red-soft')}
      />
    </Enveloppe>
  );
}
