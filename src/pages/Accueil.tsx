import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDonnees } from '../donnees';
import { ChoixPeriode, Bouton, Entete, Mesures, Statut, Vide, Zone } from '../ui/pieces';
import { Panneau, Texte } from '../ui/Panneau';
import { GraphiqueDepenseCa } from '../ui/Graphique';
import { NOM_CANAL, bilan, envoyerDemande, periodePrecedente, serieJournaliere, variation } from '../services/espaceClient';
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
  /* Le bandeau « En bref » disait en prose ce que la page dit déjà
     trois fois : la première phrase reprenait les quatre chiffres qui
     la suivent, la deuxième une ligne du journal, la troisième la
     première ligne de « Ce qui arrive », juste en dessous. Deux
     bandeaux pour un seul contenu. Les chiffres passent devant, et le
     travail de l'agence a sa zone, qui mène au journal.

     `synthese` reste au service : le rapport mensuel s'en sert, et
     là-bas le lecteur n'a pas la page sous les yeux. */
  const [demande, setDemande] = useState(false);

  if (d.chargement) return <Vide>Chargement…</Vide>;

  const aValider = d.creations.filter((c) => c.statut === 'a_valider');
  const campagnesActives = d.campagnes.filter((c) => c.statut === 'active');
  /* Les trois dernières actions, pas toute l'histoire : le journal
     est à un clic et c'est lui qui la raconte. */
  const recentes = [...d.actions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
  const prochaines = d.etapes
    .filter((e) => e.statut !== 'fait')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);


  return (
    <>
      <Entete
        titre={`Bonjour, ${d.marque?.contact.split(' ')[0] ?? ''}`}
        /* La longueur de la période est déjà sur le sélecteur, à
           droite du même bandeau : la répéter ici faisait deux fois
           « 30 jours » sur une ligne. */
        sous={d.marque?.nom}
        actions={
          <>
            <ChoixPeriode />
            <Bouton ton="accent" onClick={() => setDemande(true)}>Demander quelque chose</Bouton>
          </>
        }
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
        </div>
      </Zone>

      <Zone
        titre="Ce qu'on a fait"
        compte={d.actions.length}
        action={
          d.actions.length > 3 ? (
            <Link to="/journal" className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink transition-colors">
              Tout le journal
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
