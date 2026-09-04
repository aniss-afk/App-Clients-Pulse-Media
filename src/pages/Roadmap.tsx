import { useMemo } from 'react';
import { useDonnees } from '../donnees';
import { Entete, Statut, Vide, Zone } from '../ui/pieces';
import { dateLongue, euro } from '../lib';

/**
 * Ce qui est prévu, et où on en est.
 *
 * Une frise verticale plutôt qu'un tableau : les étapes ont un ordre
 * et une durée, un tableau les aplatit. Le passé reste visible — c'est
 * lui qui rend le futur crédible.
 */
export function Roadmap() {
  const { etapes, campagnes, chargement } = useDonnees();

  const produitDe = useMemo(() => new Map(campagnes.map((c) => [c.id, c.produit])), [campagnes]);

  if (chargement) return <Vide>Chargement…</Vide>;

  const triees = [...etapes].sort((a, b) => (a.date < b.date ? -1 : 1));
  const aVenir = triees.filter((e) => e.statut !== 'fait');
  const faites = triees.filter((e) => e.statut === 'fait').reverse();

  return (
    <>
      <Entete titre="Roadmap" sous="Ce qui est prévu, dans l'ordre, et ce qui est déjà fait." />

      <Zone titre="Campagnes" compte={campagnes.length}>
        <ul className="divide-y divide-line">
          {campagnes
            .slice()
            .sort((a, b) => (a.debut < b.debut ? 1 : -1))
            .map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium">{c.produit}</span>
                    <Statut valeur={c.statut} />
                  </div>
                  <span className="text-sm text-ink-faint tabular-nums">
                    {dateLongue(c.debut)} → {dateLongue(c.fin)}
                  </span>
                </div>
                <p className="text-sm text-ink-muted mt-1">
                  {c.createursEngages} créateur{c.createursEngages > 1 ? 's' : ''} engagé
                  {c.createursEngages > 1 ? 's' : ''} · {c.videosLivrees} / {c.videosAttendues} vidéos
                  {c.prixTtc !== null && ` · produit à ${euro(c.prixTtc)}`}
                </p>
              </li>
            ))}
        </ul>
      </Zone>

      <Zone titre="À venir" compte={aVenir.length}>
        {aVenir.length === 0 ? <Vide>Rien de planifié.</Vide> : <Frise etapes={aVenir} produitDe={produitDe} />}
      </Zone>

      <Zone titre="Déjà fait" compte={faites.length}>
        {faites.length === 0 ? <Vide>Rien encore.</Vide> : <Frise etapes={faites} produitDe={produitDe} passe />}
      </Zone>
    </>
  );
}

function Frise({
  etapes,
  produitDe,
  passe = false,
}: {
  etapes: { id: string; date: string; titre: string; detail: string; statut: string; campagneId: string | null }[];
  produitDe: Map<string, string>;
  passe?: boolean;
}) {
  return (
    <ol className="px-5 py-5">
      {etapes.map((e, i) => (
        <li key={e.id} className="flex gap-5">
          {/* Le fil et la pastille : le rouge marque ce qui est en cours,
              rien d'autre, sinon il ne marque plus rien. */}
          <div className="flex flex-col items-center shrink-0 w-3">
            <span
              className={`w-3 h-3 rounded-pill mt-1.5 ${
                e.statut === 'en_cours' ? 'bg-red' : passe ? 'bg-ink/30' : 'bg-ink/15 border border-line-strong'
              }`}
            />
            {i < etapes.length - 1 && <span className="w-px flex-1 bg-line my-1.5" />}
          </div>
          <div className={`pb-6 min-w-0 ${passe ? 'opacity-70' : ''}`}>
            <div className="text-sm text-ink-faint tabular-nums">{dateLongue(e.date)}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span className="text-base font-medium">{e.titre}</span>
              {e.campagneId && (
                <span className="text-xs text-ink-faint">{produitDe.get(e.campagneId) ?? ''}</span>
              )}
            </div>
            <p className="text-sm text-ink-muted mt-1 max-w-[70ch]">{e.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
