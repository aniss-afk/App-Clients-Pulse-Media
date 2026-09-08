import { ReactNode } from 'react';
import { cn } from '../lib';
import { Carte, Surligne } from './marque';

/* ---------------- En-têtes ---------------- */

export function Entete({
  titre,
  sous,
  actions,
}: {
  titre: string;
  sous?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 pb-8">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em]">{titre}</h1>
        {sous && <p className="mt-2 text-md text-ink-muted">{sous}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Une zone = un titre et une carte. Pas d'empilement de boîtes. */
export function Zone({
  titre,
  compte,
  action,
  children,
}: {
  titre?: string;
  compte?: number;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      {titre && (
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-md font-bold tracking-[-0.015em] mb-1.5">
              {titre}
              {compte !== undefined && (
                <span className="text-ink-faint font-medium"> · {compte}</span>
              )}
            </h2>
          </div>
          {action}
        </div>
      )}
      <Carte plat>{children}</Carte>
    </section>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="py-12 text-sm text-ink-faint text-center">{children}</p>;
}

/* ---------------- Chiffres ---------------- */

export function Mesures({
  items,
  sobre = false,
  encastre = false,
}: {
  /** Aucun surlignage : la page a déjà son chiffre fort ailleurs. */
  sobre?: boolean;
  /** Posé dans une carte existante : pas de cadre propre. */
  encastre?: boolean;
  items: {
    label: string;
    valeur: string;
    sous?: string;
    /** Écart avec la période précédente, en %. Null = pas comparable. */
    delta?: number | null;
    /** Le chiffre qu'on vient chercher. Un seul par grille. */
    fort?: boolean;
  }[];
}) {
  const hero = sobre ? -1 : Math.max(0, items.findIndex((m) => m.fort));
  return (
    <div
      className={cn(
        'bg-line grid gap-px grid-cols-2 sm:grid-cols-4',
        encastre ? 'border-b border-line' : 'rounded-card border border-line overflow-hidden',
      )}
    >
      {items.map((m, i) => (
        <div key={m.label} className="bg-paper px-5 py-4 min-h-[104px] flex flex-col justify-between">
          <p className="text-sm font-medium text-ink-muted">{m.label}</p>
          <div>
            <p className="text-2xl font-bold tracking-[-0.02em] tabular-nums mt-2">
              {i === hero ? <Surligne>{m.valeur}</Surligne> : m.valeur}
            </p>
            {(m.sous || m.delta !== undefined) && (
              <p className="text-xs mt-1.5 text-ink-faint">
                {m.delta !== undefined && <Delta v={m.delta} />}
                {m.delta !== undefined && m.sous && ' · '}
                {m.sous}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Écart en pourcentage. Jamais en couleur : le rouge est le repère de
 *  la marque, pas un jugement sur le chiffre. */
export function Delta({ v }: { v: number | null }) {
  if (v === null) return <span>—</span>;
  const r = Math.round(v);
  if (r === 0) return <span className="text-ink font-medium">= stable</span>;
  return (
    <span className="text-ink font-medium tabular-nums">
      {r > 0 ? '↑' : '↓'} {Math.abs(r)} %
    </span>
  );
}

/* ---------------- Tableaux ---------------- */

export function Tableau({ colonnes, children }: { colonnes: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base border-collapse">
        <thead>
          <tr className="text-left">
            {colonnes.map((c) => (
              <th
                key={c}
                className="px-5 pt-5 pb-3 text-micro font-semibold uppercase text-ink-faint whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Rangee({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-t border-line',
        onClick && 'cursor-pointer transition-colors hover:bg-inset',
      )}
    >
      {children}
    </tr>
  );
}

export function Case({
  children,
  mono,
  aDroite,
  discret,
}: {
  children: ReactNode;
  mono?: boolean;
  aDroite?: boolean;
  discret?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-5 py-4 align-middle',
        mono && 'tabular-nums',
        aDroite && 'text-right',
        discret && 'text-ink-muted',
      )}
    >
      {children}
    </td>
  );
}

/* ---------------- Boutons ---------------- */

export function Bouton({
  children,
  onClick,
  ton = 'neutre',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  ton?: 'neutre' | 'accent' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const tons = {
    neutre: 'border-line-strong text-ink-muted hover:text-ink hover:border-ink/40',
    accent: 'border-ink bg-ink text-paper hover:bg-ink/90',
    danger: 'border-red-soft text-red-ink hover:bg-red-pale',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3.5 py-1.5 rounded-pill border text-sm font-medium transition-colors disabled:opacity-40',
        tons[ton],
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Statuts ---------------- */

/* Un libellé par valeur, à un seul endroit : le même mot doit
   apparaître partout où l'état apparaît. */
const STATUTS: Record<string, { texte: string; classe: string }> = {
  // Créations
  a_valider: { texte: 'À valider', classe: 'bg-warning-bg text-warning' },
  validee: { texte: 'Validée', classe: 'bg-success-bg text-success' },
  a_revoir: { texte: 'À revoir', classe: 'bg-red-pale text-red-ink' },
  en_ligne: { texte: 'En ligne', classe: 'bg-info-bg text-info' },
  // Campagnes et étapes
  a_venir: { texte: 'À venir', classe: 'bg-deep text-ink-muted' },
  en_cours: { texte: 'En cours', classe: 'bg-info-bg text-info' },
  fait: { texte: 'Fait', classe: 'bg-success-bg text-success' },
  active: { texte: 'Active', classe: 'bg-success-bg text-success' },
  terminee: { texte: 'Terminée', classe: 'bg-deep text-ink-muted' },
  retard: { texte: 'En retard', classe: 'bg-red-pale text-red-ink' },
};

export function Statut({ valeur }: { valeur: string }) {
  const s = STATUTS[valeur] ?? { texte: valeur, classe: 'bg-deep text-ink-muted' };
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md',
        s.classe,
      )}
    >
      {s.texte}
    </span>
  );
}

export const libelleStatut = (valeur: string) => STATUTS[valeur]?.texte ?? valeur;
