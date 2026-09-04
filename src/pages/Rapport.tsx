import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DonneesProvider, useDonnees } from '../donnees';
import { GraphiqueDepenseCa, Legende } from '../ui/Graphique';
import { Surligne, Trait } from '../ui/marque';
import { Delta } from '../ui/pieces';
import {
  NOM_PLATEFORME,
  Plateforme,
  bilan,
  periodeDuMois,
  periodePrecedente,
  serieJournaliere,
  variation,
} from '../services/espaceClient';
import { compact, euro, mois as libelleMois, nombre, ratio } from '../lib';

/**
 * Le rapport d'un mois, tel qu'on l'imprime.
 *
 * Une page seule, sans barre latérale : ce document sort de l'écran —
 * il est envoyé, imprimé, glissé dans un comité. Il porte donc son
 * propre fournisseur de données.
 */
export function Rapport() {
  return (
    <DonneesProvider>
      <Corps />
    </DonneesProvider>
  );
}

function Corps() {
  const { mois } = useParams<{ mois: string }>();
  const d = useDonnees();
  const m = mois ?? d.periode.fin.slice(0, 7);
  const periode = useMemo(() => periodeDuMois(m), [m]);

  const actuel = useMemo(() => bilan(d.metriques, d.ca, periode), [d.metriques, d.ca, periode]);
  const avant = useMemo(
    () => bilan(d.metriques, d.ca, periodePrecedente(periode)),
    [d.metriques, d.ca, periode],
  );
  const serie = useMemo(() => serieJournaliere(d.metriques, d.ca, periode), [d.metriques, d.ca, periode]);

  if (d.chargement) return <p className="p-10 text-sm text-ink-faint">Chargement…</p>;

  const plateformes = Object.keys(actuel.depenseParPlateforme).sort() as Plateforme[];

  /* Les créations diffusées dans le mois, et ce qu'elles ont fait. */
  const creations = d.creations.filter(
    (c) => c.statut === 'en_ligne' && c.publieeLe && c.publieeLe >= periode.debut && c.publieeLe <= periode.fin,
  );
  const vues = creations.reduce((s, c) => s + c.vues, 0);
  const ventes = creations.reduce((s, c) => s + c.ventes, 0);

  /* Une lecture écrite à partir des chiffres, pas à côté : si le retour
     baisse, la phrase le dit. */
  const lecture: string[] = [];
  if (actuel.mer !== null) {
    const varMer = avant.mer !== null ? variation(actuel.mer, avant.mer) : null;
    lecture.push(
      `Chaque euro investi en publicité a rapporté ${ratio(actuel.mer)} de chiffre d'affaires` +
        (varMer === null || Math.abs(varMer) < 0.5
          ? ', stable par rapport au mois précédent.'
          : varMer > 0
            ? `, en hausse de ${Math.round(varMer)} % sur le mois précédent.`
            : `, en baisse de ${Math.abs(Math.round(varMer))} % sur le mois précédent.`),
    );
  }
  if (actuel.cpa !== null) {
    lecture.push(
      `Un nouveau client a coûté ${euro(actuel.cpa)} à acquérir, pour ${nombre(actuel.nouveauxClients)} nouveaux clients sur le mois.`,
    );
  }
  if (creations.length > 0) {
    lecture.push(
      `${creations.length} vidéo${creations.length > 1 ? 's' : ''} mise${creations.length > 1 ? 's' : ''} en ligne, ${compact(vues)} vues, ${ventes} vente${ventes > 1 ? 's' : ''} attribuée${ventes > 1 ? 's' : ''} aux codes promo.`,
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink print:bg-white">
      <div className="max-w-[860px] mx-auto px-8 py-10 print:px-0 print:py-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link to="/rapports" className="text-xs text-ink-muted hover:text-ink">
            ← Rapports
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-pill border border-ink bg-ink text-paper text-sm font-medium hover:bg-ink/90"
          >
            Imprimer / PDF
          </button>
        </div>

        <header className="flex items-start justify-between gap-6 pb-6 border-b border-line">
          <div>
            <img src="/logo.webp" alt="Pulse Media" className="h-[22px] w-auto mb-5" />
            <h1 className="text-3xl font-bold tracking-[-0.02em]">{d.marque?.nom}</h1>
            <p className="mt-1 text-md text-ink-muted">Rapport de {libelleMois(m)}</p>
          </div>
          <p className="text-xs text-ink-faint text-right leading-relaxed">
            {d.marque?.contact}
            <br />
            Établi le{' '}
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <section className="pt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-card overflow-hidden">
            <Chiffre label="Dépense publicitaire" valeur={euro(actuel.depense)} delta={variation(actuel.depense, avant.depense)} />
            <Chiffre label="Chiffre d'affaires" valeur={euro(actuel.ca)} delta={variation(actuel.ca, avant.ca)} sous={`${nombre(actuel.commandes)} commandes`} />
            <Chiffre
              label="Retour sur dépense"
              valeur={ratio(actuel.mer)}
              delta={actuel.mer !== null && avant.mer !== null ? variation(actuel.mer, avant.mer) : null}
              fort
            />
            <Chiffre
              label="Coût par nouveau client"
              valeur={actuel.cpa !== null ? euro(actuel.cpa) : '—'}
              sous={`${nombre(actuel.nouveauxClients)} nouveaux clients`}
            />
          </div>
          <div className="mt-6">
            <GraphiqueDepenseCa points={serie} hauteur={180} />
            <div className="mt-3">
              <Legende />
            </div>
          </div>
        </section>

        {lecture.length > 0 && (
          <section className="pt-8">
            <Titre>Lecture</Titre>
            <ul className="space-y-2 text-md leading-relaxed max-w-[64ch]">
              {lecture.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-8">
          <Titre>Par canal</Titre>
          {plateformes.length === 0 ? (
            <p className="text-sm text-ink-faint">Aucune dépense sur le mois.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-micro uppercase font-semibold text-ink-faint">
                  <th className="py-2 font-semibold">Canal</th>
                  <th className="py-2 text-right font-semibold">Dépense</th>
                  <th className="py-2 text-right font-semibold">Part</th>
                  <th className="py-2 text-right font-semibold">Retour déclaré</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plateformes.map((p) => (
                  <tr key={p}>
                    <td className="py-2.5">{NOM_PLATEFORME[p] ?? p}</td>
                    <td className="py-2.5 text-right tabular-nums">{euro(actuel.depenseParPlateforme[p])}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {actuel.depense > 0
                        ? `${Math.round((actuel.depenseParPlateforme[p] / actuel.depense) * 100)} %`
                        : '—'}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{ratio(actuel.roasParPlateforme[p])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-ink-faint max-w-[64ch] leading-relaxed">
            Le retour déclaré est celui de chaque plateforme, qui compte les mêmes ventes que les
            autres. Le retour sur dépense en haut de page rapporte la dépense totale au chiffre
            d&apos;affaires réel de la boutique : c&apos;est celui à suivre.
          </p>
        </section>

        <section className="pt-8">
          <Titre>Créations diffusées</Titre>
          {creations.length === 0 ? (
            <p className="text-sm text-ink-faint">Aucune vidéo mise en ligne sur le mois.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-micro uppercase font-semibold text-ink-faint">
                  <th className="py-2 font-semibold">Vidéo</th>
                  <th className="py-2 font-semibold">Angle</th>
                  <th className="py-2 text-right font-semibold">Vues</th>
                  <th className="py-2 text-right font-semibold">Ventes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {creations.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5">{c.titre}</td>
                    <td className="py-2.5 text-ink-muted">{c.angle}</td>
                    <td className="py-2.5 text-right tabular-nums">{compact(c.vues)}</td>
                    <td className="py-2.5 text-right tabular-nums">{c.ventes}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-2.5">Total</td>
                  <td />
                  <td className="py-2.5 text-right tabular-nums">{compact(vues)}</td>
                  <td className="py-2.5 text-right tabular-nums">{ventes}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-12 pt-5 border-t border-line text-xs text-ink-faint flex justify-between">
          <span>Pulse Media · bypulsemedia.fr</span>
          <span>{libelleMois(m)}</span>
        </footer>
      </div>
    </div>
  );
}

function Titre({ children }: { children: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-md font-bold tracking-[-0.015em] mb-1.5">{children}</h2>
      <Trait />
    </div>
  );
}

function Chiffre({
  label,
  valeur,
  delta,
  sous,
  fort,
}: {
  label: string;
  valeur: string;
  delta?: number | null;
  sous?: string;
  fort?: boolean;
}) {
  return (
    <div className="bg-paper px-5 py-4 min-h-[96px] flex flex-col justify-between">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <div>
        <p className="text-xl font-bold tracking-[-0.02em] tabular-nums mt-2">
          {fort ? <Surligne>{valeur}</Surligne> : valeur}
        </p>
        <p className="text-xs mt-1 text-ink-faint">
          {delta !== undefined && <Delta v={delta} />}
          {delta !== undefined && sous && ' · '}
          {sous}
        </p>
      </div>
    </div>
  );
}
