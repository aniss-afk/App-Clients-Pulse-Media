import { CanauxBoutique } from '../ui/pilotage/CanauxBoutique';
import { PilotageBoutique } from '../ui/pilotage/PilotageBoutique';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useDonnees } from '../donnees';
import { Case, ChoixPeriode, Bouton, Entete, Rangee, Statut, Tableau, Vide, Zone } from '../ui/pieces';
import { Panneau, Texte } from '../ui/Panneau';
import {
  NOM_CANAL,
  bilan,
  envoyerDemande,
  periodeDuMois,
} from '../services/espaceClient';
import { dateLongue, euro, mois as libelleMois, ratio } from '../lib';

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
    const mois = [...new Set([...d.ca, ...d.metriques, ...d.actions].map((c) => c.date.slice(0, 7)))].sort().reverse();
    return mois.map((m) => {
      const periode = periodeDuMois(m);
      const jours = Math.round((Date.parse(periode.fin) - Date.parse(periode.debut)) / 86400000) + 1;
      return { mois: m, jours, bilan: bilan(d.metriques, d.ca, periode) };
    });
  }, [d.metriques, d.ca, d.actions]);

  if (d.chargement) return <Vide>Chargement…</Vide>;

  const aValider = d.creations.filter((c) => c.statut === 'a_valider');
  const campagnesActives = d.campagnes.filter((c) => c.statut === 'active');
  /* Les trois dernières actions, pas toute l'histoire : le journal
     est à un clic et c'est lui qui la raconte. */
  const actionsPeriode = d.actions.filter(a => a.date >= d.periode.debut && a.date <= d.periode.fin);
  const recentes = [...actionsPeriode].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);

  const prochaines = d.etapes
    .filter((e) => e.statut !== 'fait')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);


  return (
    <>
      <Entete
        titre="Vue d’ensemble"
        sous={`${dateLongue(d.periode.debut)} — ${dateLongue(d.periode.fin)}`}
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

      <PilotageBoutique />
      <CanauxBoutique />

      <details className="mt-5"><summary className="cursor-pointer text-sm font-medium py-3">Suivi et rapports</summary><div className="pt-3">
      <Zone
        titre="Ce qu'on a fait"
        compte={actionsPeriode.length}
        action={
          actionsPeriode.length > 3 ? (
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
                    style={{ width: `${c.videosAttendues > 0 ? Math.min(100, (c.videosLivrees / c.videosAttendues) * 100) : 0}%` }}
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
          <Tableau colonnes={['Mois', 'Dépense', "Encaissements boutique", 'Retour', '']}>
            {rapports.map((l) => (
              <Rangee key={l.mois}>
                <Case>
                  <span className="font-medium">{libelleMois(l.mois)}</span>
                  {l.mois === new Date().toISOString().slice(0, 7) && (
                    <span className="text-[11px] text-ink-faint ml-2">en cours</span>
                  )}
                </Case>
                <Case mono aDroite>{l.bilan.joursPublicite ? <>{euro(l.bilan.depense)}{l.bilan.joursPublicite < l.jours && <small className="block text-xs text-ink-muted">partiel</small>}</> : '—'}</Case>
                <Case mono aDroite>{l.bilan.joursBoutique ? <>{euro(l.bilan.ca)}{l.bilan.joursBoutique < l.jours && <small className="block text-xs text-ink-muted">partiel</small>}</> : '—'}</Case>
                <Case mono aDroite>{l.bilan.joursBoutique === l.jours && l.bilan.joursPublicite === l.jours ? ratio(l.bilan.mer) : '—'}</Case>
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

      </div></details>

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
    } catch {
      setFaute('Votre demande n’a pas été enregistrée. Réessayez.');
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
