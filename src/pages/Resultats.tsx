import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useDonnees } from '../donnees';
import { Case, ChoixPeriode, Bouton, Entete, Mesures, Rangee, Statut, Tableau, Vide, Zone } from '../ui/pieces';
import { Panneau, Texte } from '../ui/Panneau';
import { GraphiqueDepenseCa } from '../ui/Graphique';
import {
  NOM_CANAL,
  NOM_PLATEFORME,
  Plateforme,
  bilan,
  envoyerDemande,
  periodeDuMois,
  periodePrecedente,
  serieJournaliere,
  variation,
} from '../services/espaceClient';
import { dateLongue, euro, mois as libelleMois, nombre, ratio } from '../lib';

/**
 * Ce que ça rapporte.
 *
 * Trois pages disaient la même chose sous trois angles : l'accueil
 * portait quatre chiffres et un graphique, « Performance » les mêmes
 * quatre chiffres et le même graphique avec le détail par canal,
 * « Rapports » le même calcul découpé par mois. Une seule page, du plus
 * gros au plus fin : ce qu'on attend de vous, les chiffres, le jour par
 * jour, le détail par canal, notre travail, ce qui vient, et les
 * rapports à imprimer.
 */
export function Resultats() {
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
  /* Le bandeau « En bref » disait en prose ce que la page dit déjà
     trois fois : la première phrase reprenait les quatre chiffres qui
     la suivent, la deuxième une ligne du journal, la troisième la
     première ligne de « Ce qui arrive », juste en dessous. Deux
     bandeaux pour un seul contenu. Les chiffres passent devant, et le
     travail de l'agence a sa zone, qui mène au journal.

     `synthese` reste au service : le rapport mensuel s'en sert, et
     là-bas le lecteur n'a pas la page sous les yeux. */
  const [demande, setDemande] = useState(false);
  /* Les mois où il s'est passé quelque chose, déduits des données
     plutôt que d'une liste écrite à la main qui finirait par diverger. */
  const rapports = useMemo(() => {
    const mois = [...new Set(d.ca.map((c) => c.date.slice(0, 7)))].sort().reverse();
    return mois.map((m) => ({ mois: m, bilan: bilan(d.metriques, d.ca, periodeDuMois(m)) }));
  }, [d.metriques, d.ca]);

  if (d.chargement) return <Vide>Chargement…</Vide>;

  const aValider = d.creations.filter((c) => c.statut === 'a_valider');
  const campagnesActives = d.campagnes.filter((c) => c.statut === 'active');
  /* Les trois dernières actions, pas toute l'histoire : le journal
     est à un clic et c'est lui qui la raconte. */
  const recentes = [...d.actions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);

  /* Ce que la page « Performance » disait en plus, et qui n'était que
     le dépliage de ces mêmes quatre chiffres : où part la dépense, ce
     que chaque plateforme s'attribue, et le trafic acheté. */
  const plateformes = Object.keys(actuel.depenseParPlateforme).sort() as Plateforme[];
  const surAttribution = actuel.ca > 0 ? (actuel.revenuAttribue / actuel.ca) * 100 : null;
  const dansPeriode = d.metriques.filter((m) => m.date >= d.periode.debut && m.date <= d.periode.fin);
  const impressions = dansPeriode.reduce((sm, m) => sm + m.impressions, 0);
  const clics = dansPeriode.reduce((sm, m) => sm + m.clics, 0);
  const prochaines = d.etapes
    .filter((e) => e.statut !== 'fait')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);


  return (
    <>
      <Entete
        titre={`Bonjour, ${d.marque?.contact.split(' ')[0] ?? ''}`}
        /* Ni le nom de la marque ni la longueur de la période : elle
           sait chez qui elle est, et le sélecteur à droite dit déjà
           « 30 j ». Un sous-titre qui ne raconte rien vaut moins que
           pas de sous-titre. */
        actions={
          <>
            <ChoixPeriode />
            <Bouton ton="accent" onClick={() => setDemande(true)}>Demander quelque chose</Bouton>
          </>
        }
      />

      {aValider.length > 0 && (
        <Zone titre="On vous attend" compte={aValider.length}>
          {/* Le filet rouge court sur toute la zone plutôt que sur
              chaque ligne : c'est le bloc qui demande une réponse, pas
              chaque vidéo séparément. Trois traits empilés donnaient
              trois alertes là où il n'y en a qu'une. */}
          <ul className="divide-y divide-line shadow-[inset_3px_0_0_0_#FF3B30] rounded-l-card overflow-hidden">
            {aValider.map((c) => (
              <li key={c.id}>
                <Link
                  to="/creations"
                  className="group flex items-baseline gap-x-2.5 gap-y-0.5 flex-wrap px-5 py-4 transition-colors hover:bg-inset"
                >
                  {/* Le titre et l'angle se suivent au lieu de se
                      partager la ligne : collés à droite, l'angle
                      obligeait à traverser un vide pour comprendre de
                      quelle vidéo on parle. */}
                  <span className="text-base font-medium">{c.titre}</span>
                  <span className="text-sm text-ink-muted">{c.angle}</span>
                  {c.createur && <span className="text-sm text-ink-faint">{c.createur}</span>}
                  <ChevronRight
                    className="ml-auto w-4 h-4 shrink-0 self-center text-ink-faint transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
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
        </div>
      </Zone>

      <Zone titre="Par canal" compte={plateformes.length}>
        {plateformes.length === 0 ? (
          <Vide>Aucune dépense sur la période.</Vide>
        ) : (
          <>
            <Tableau colonnes={['Canal', 'Dépense', 'Part', 'Retour déclaré']}>
              {plateformes.map((pf) => (
                <Rangee key={pf}>
                  <Case>{NOM_PLATEFORME[pf] ?? pf}</Case>
                  <Case mono aDroite>{euro(actuel.depenseParPlateforme[pf])}</Case>
                  <Case mono aDroite>
                    {actuel.depense > 0
                      ? `${Math.round((actuel.depenseParPlateforme[pf] / actuel.depense) * 100)} %`
                      : '—'}
                  </Case>
                  <Case mono aDroite>{ratio(actuel.roasParPlateforme[pf])}</Case>
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
                plus haut, calculé sur la boutique, est le chiffre à suivre.
              </p>
            )}
            <div className="grid gap-px bg-line sm:grid-cols-3 border-t border-line">
              {[
                { label: 'Impressions', valeur: nombre(impressions) },
                { label: 'Clics', valeur: nombre(clics) },
                { label: 'Coût par clic', valeur: clics > 0 ? euro(actuel.depense / clics) : '—' },
              ].map((m) => (
                <div key={m.label} className="bg-paper px-5 py-4">
                  <p className="text-sm font-medium text-ink-muted">{m.label}</p>
                  <p className="text-lg font-bold tracking-[-0.02em] tabular-nums mt-1.5">{m.valeur}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Zone>

      <Zone
        titre="Ce qu'on a fait"
        compte={d.actions.length}
        action={
          d.actions.length > 3 ? (
            <Link to="/suivi" className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink transition-colors">
              Tout le suivi
            </Link>
          ) : undefined
        }
      >
        {recentes.length === 0 ? (
          <Vide>Rien à signaler sur la période.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {recentes.map((a) => (
              <li key={a.id} className="px-5 py-4 flex gap-5">
                <span className="text-sm text-ink-faint w-[104px] shrink-0">
                  <span className="block tabular-nums">
                    {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  </span>
                  <span className="block text-xs font-medium text-ink-muted mt-0.5">{NOM_CANAL[a.canal]}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-medium">{a.action}</span>
                  {a.resultat && (
                    <span className="block text-sm text-ink-muted mt-1 leading-relaxed">→ {a.resultat}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
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
                  <p className="text-sm text-ink-muted mt-0.5">{e.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Zone>

      {d.demandes.length > 0 && (
        <Zone titre="Vos demandes" compte={d.demandes.length}>
          <ul className="divide-y divide-line">
            {d.demandes.map((dm) => (
              <li key={dm.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-base">{dm.texte}</p>
                  <span className="text-xs text-ink-faint shrink-0 tabular-nums">{dateLongue(dm.date)}</span>
                </div>
                <p className={`text-sm mt-1.5 leading-relaxed ${dm.reponse ? 'text-ink-muted' : 'text-ink-faint'}`}>
                  {dm.reponse ? <>→ {dm.reponse}</> : dm.statut === 'prise_en_compte' ? 'Prise en compte, réponse en cours.' : 'Envoyée. L\u2019équipe vous répond sous 24 h ouvrées.'}
                </p>
              </li>
            ))}
          </ul>
        </Zone>
      )}

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

      <Zone titre="Rapports mensuels" compte={rapports.length}>
        {rapports.length === 0 ? (
          <Vide>Aucun rapport disponible.</Vide>
        ) : (
          <Tableau colonnes={['Mois', 'Dépense', "Chiffre d'affaires", 'Retour', '']}>
            {rapports.map((l) => (
              <Rangee key={l.mois}>
                <Case>
                  <span className="font-medium">{libelleMois(l.mois)}</span>
                  {l.mois === d.periode.fin.slice(0, 7) && (
                    <span className="text-[11px] text-ink-faint ml-2">en cours</span>
                  )}
                </Case>
                <Case mono aDroite>{euro(l.bilan.depense)}</Case>
                <Case mono aDroite>{euro(l.bilan.ca)}</Case>
                <Case mono aDroite>{ratio(l.bilan.mer)}</Case>
                <Case aDroite>
                  <Link
                    to={`/rapports/${l.mois}`}
                    className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
                  >
                    Ouvrir
                  </Link>
                </Case>
              </Rangee>
            ))}
          </Tableau>
        )}
      </Zone>

      {demande && <PanneauDemande onFermer={() => setDemande(false)} onFait={d.recharger} />}
    </>
  );
}

function PanneauDemande({ onFermer, onFait }: { onFermer: () => void; onFait: () => Promise<void> }) {
  const [texte, setTexte] = useState('');
  const [faute, setFaute] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function valider() {
    if (texte.trim().length < 10) {
      setFaute('Quelques mots de plus : on veut comprendre du premier coup.');
      return;
    }
    setEnCours(true);
    try {
      await envoyerDemande(texte.trim());
      await onFait();
      onFermer();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Panneau
      titre="Demander quelque chose"
      sous="Une idée, une question, un produit à pousser. Ça arrive directement à l'équipe qui suit votre compte."
      ouvert
      onFermer={onFermer}
      onValider={valider}
      valider="Envoyer"
      enCours={enCours}
    >
      <Texte
        label="Votre demande"
        valeur={texte}
        onChange={(v) => { setTexte(v); setFaute(''); }}
        lignes={6}
        placeholder="On aimerait mettre le coffret en avant pour Noël, c'est possible ?"
        faute={faute}
      />
    </Panneau>
  );
}
