import { useMemo } from 'react';
import { useDonnees } from '../donnees';
import { ChoixPeriode, Case, Entete, Mesures, Rangee, Tableau, Vide, Zone } from '../ui/pieces';
import { GraphiqueDepenseCa, Legende } from '../ui/Graphique';
import {
  NOM_PLATEFORME,
  Plateforme,
  bilan,
  periodePrecedente,
  serieJournaliere,
  variation,
} from '../services/espaceClient';
import { euro, nombre, ratio } from '../lib';

/**
 * La performance, sur tous les canaux.
 *
 * Deux lectures sont montrées côte à côte et nommées : le retour que
 * chaque plateforme déclare, et celui qui se calcule sur le chiffre
 * d'affaires réel de la boutique. Les premiers s'additionnent à plus
 * de 100 % — chacun s'attribue les mêmes ventes. Le second est le seul
 * qui explique le compte en banque, et le cacher serait plus simple
 * que de l'expliquer.
 */
export function Performance() {
  const d = useDonnees();

  const actuel = useMemo(() => bilan(d.metriques, d.ca, d.periode), [d.metriques, d.ca, d.periode]);
  const avant = useMemo(
    () => bilan(d.metriques, d.ca, periodePrecedente(d.periode)),
    [d.metriques, d.ca, d.periode],
  );
  const serie = useMemo(
    () => serieJournaliere(d.metriques, d.ca, d.periode),
    [d.metriques, d.ca, d.periode],
  );

  if (d.chargement) return <Vide>Chargement…</Vide>;

  const plateformes = Object.keys(actuel.depenseParPlateforme).sort() as Plateforme[];
  const surAttribution = actuel.ca > 0 ? (actuel.revenuAttribue / actuel.ca) * 100 : null;

  /* Trafic cumulé : ce sont des volumes, ils s'additionnent sans
     double compte, contrairement aux revenus attribués. */
  const dansPeriode = d.metriques.filter((m) => m.date >= d.periode.debut && m.date <= d.periode.fin);
  const impressions = dansPeriode.reduce((s, m) => s + m.impressions, 0);
  const clics = dansPeriode.reduce((s, m) => s + m.clics, 0);

  return (
    <>
      <Entete
        titre="Performance"
        sous={`Du ${new Date(d.periode.debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${new Date(d.periode.fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`}
        actions={<ChoixPeriode />}
      />

      <Mesures
        items={[
          {
            label: 'Retour sur dépense',
            valeur: ratio(actuel.mer),
            delta: actuel.mer !== null && avant.mer !== null ? variation(actuel.mer, avant.mer) : null,
            sous: 'CA réel ÷ dépense',
            fort: true,
          },
          { label: "Chiffre d'affaires", valeur: euro(actuel.ca), delta: variation(actuel.ca, avant.ca), sous: `${nombre(actuel.commandes)} commandes` },
          { label: 'Dépense publicitaire', valeur: euro(actuel.depense), delta: variation(actuel.depense, avant.depense) },
          {
            label: 'Coût par nouveau client',
            valeur: actuel.cpa !== null ? euro(actuel.cpa) : '—',
            sous: `${nombre(actuel.nouveauxClients)} nouveaux clients`,
          },
        ]}
      />

      <div className="pt-8" />

      <Zone titre="Jour par jour">
        <div className="p-5 sm:p-6">
          <GraphiqueDepenseCa points={serie} hauteur={200} />
          <div className="mt-3">
            <Legende />
          </div>
        </div>
      </Zone>

      <Zone titre="Par canal" compte={plateformes.length}>
        {plateformes.length === 0 ? (
          <Vide>Aucune dépense sur la période.</Vide>
        ) : (
          <>
            <Tableau colonnes={['Canal', 'Dépense', 'Part', 'Retour déclaré']}>
              {plateformes.map((p) => (
                <Rangee key={p}>
                  <Case>{NOM_PLATEFORME[p] ?? p}</Case>
                  <Case mono aDroite>{euro(actuel.depenseParPlateforme[p])}</Case>
                  <Case mono aDroite>
                    {actuel.depense > 0
                      ? `${Math.round((actuel.depenseParPlateforme[p] / actuel.depense) * 100)} %`
                      : '—'}
                  </Case>
                  <Case mono aDroite>{ratio(actuel.roasParPlateforme[p])}</Case>
                </Rangee>
              ))}
            </Tableau>
            {surAttribution !== null && (
              <p className="px-5 pb-5 pt-3 text-sm text-ink-muted leading-relaxed">
                Mises bout à bout, les plateformes s&apos;attribuent{' '}
                <strong className="text-ink">{euro(actuel.revenuAttribue)}</strong> de revenu, soit{' '}
                <strong className="text-ink">{Math.round(surAttribution)} %</strong> de votre chiffre
                d&apos;affaires réel de {euro(actuel.ca)}. Chacune compte les mêmes ventes : c&apos;est
                normal, et c&apos;est pour ça qu&apos;on ne les additionne pas. Le retour sur dépense
                ci-dessus, calculé sur la boutique, est le chiffre à suivre.
              </p>
            )}
          </>
        )}
      </Zone>

      <Zone titre="Trafic">
        <div className="grid gap-px bg-line sm:grid-cols-3">
          {[
            { label: 'Impressions', valeur: nombre(impressions) },
            { label: 'Clics', valeur: nombre(clics) },
            {
              label: 'Coût par clic',
              valeur: clics > 0 ? euro(actuel.depense / clics) : '—',
            },
          ].map((m) => (
            <div key={m.label} className="bg-paper px-5 py-4">
              <p className="text-sm font-medium text-ink-muted">{m.label}</p>
              <p className="text-xl font-bold tracking-[-0.02em] tabular-nums mt-2">{m.valeur}</p>
            </div>
          ))}
        </div>
      </Zone>
    </>
  );
}
