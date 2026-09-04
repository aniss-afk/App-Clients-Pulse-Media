import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDonnees } from '../donnees';
import { Entete, Mesures, Statut, Vide, Zone } from '../ui/pieces';
import { GraphiqueDepenseCa, Legende } from '../ui/Graphique';
import { bilan, periodePrecedente, serieJournaliere, variation } from '../services/espaceClient';
import { dateLongue, euro, ratio } from '../lib';

/**
 * La page d'entrée.
 *
 * Elle répond à deux questions et s'arrête là : est-ce que ça marche,
 * et qu'est-ce qu'on attend de moi. Le détail est à un clic.
 */
export function Accueil() {
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

  const aValider = d.creations.filter((c) => c.statut === 'a_valider');
  const campagnesActives = d.campagnes.filter((c) => c.statut === 'active');
  const prochaines = d.etapes
    .filter((e) => e.statut !== 'fait')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);

  const longueur =
    Math.round((new Date(d.periode.fin).getTime() - new Date(d.periode.debut).getTime()) / 86_400_000) + 1;

  return (
    <>
      <Entete
        titre={`Bonjour, ${d.marque?.contact.split(' ')[0] ?? ''}`}
        sous={`${d.marque?.nom} — ${longueur} derniers jours.`}
      />

      {aValider.length > 0 && (
        <Zone titre="On vous attend" compte={aValider.length}>
          <ul className="divide-y divide-line">
            {aValider.map((c) => (
              <li key={c.id}>
                <Link
                  to="/creations"
                  className="flex items-center gap-5 px-5 py-3.5 transition-colors hover:bg-inset shadow-[inset_3px_0_0_0_#FF3B30]"
                >
                  <span className="text-base font-medium flex-1">{c.titre}</span>
                  <span className="text-sm text-ink-faint hidden sm:inline">{c.angle}</span>
                  <span className="text-ink-faint text-sm">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Zone>
      )}

      <section className="mb-5">
        <Mesures
          items={[
            {
              label: "Chiffre d'affaires",
              valeur: euro(actuel.ca),
              delta: variation(actuel.ca, avant.ca),
              sous: `${actuel.commandes} commandes`,
              fort: true,
            },
            {
              label: 'Dépense publicitaire',
              valeur: euro(actuel.depense),
              delta: variation(actuel.depense, avant.depense),
            },
            {
              label: 'Retour sur dépense',
              valeur: ratio(actuel.mer),
              delta: actuel.mer !== null && avant.mer !== null ? variation(actuel.mer, avant.mer) : null,
              sous: 'CA ÷ dépense',
            },
            {
              label: 'Coût par nouveau client',
              valeur: actuel.cpa !== null ? euro(actuel.cpa) : '—',
              sous: `${actuel.nouveauxClients} nouveaux clients`,
            },
          ]}
        />
      </section>

      <Zone titre="Jour par jour">
        <div className="p-5 sm:p-6">
          <GraphiqueDepenseCa points={serie} hauteur={180} />
          <div className="mt-3">
            <Legende />
          </div>
        </div>
      </Zone>

      <Zone titre="Ce qui arrive" compte={prochaines.length}>
        {prochaines.length === 0 ? (
          <Vide>Rien de planifié pour l&apos;instant.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {prochaines.map((e) => (
              <li key={e.id} className="px-5 py-4 flex items-baseline gap-5">
                <span className="text-sm text-ink-faint w-[132px] shrink-0">{dateLongue(e.date)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium">{e.titre}</span>
                    <Statut valeur={e.statut} />
                  </div>
                  <p className="text-sm text-ink-muted mt-0.5 max-w-[70ch]">{e.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Zone>

      <Zone titre="Campagnes en cours" compte={campagnesActives.length}>
        {campagnesActives.length === 0 ? (
          <Vide>Aucune campagne en cours.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {campagnesActives.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-base font-medium">{c.produit}</span>
                  <span className="text-sm text-ink-faint tabular-nums">
                    {c.videosLivrees} / {c.videosAttendues} vidéos
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 rounded-pill bg-inset overflow-hidden">
                  <span
                    className="block h-full bg-red rounded-pill"
                    style={{ width: `${Math.min(100, (c.videosLivrees / c.videosAttendues) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Zone>
    </>
  );
}
