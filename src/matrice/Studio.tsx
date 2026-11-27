import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCheck, ChevronRight, Grid2X2, MessageSquare } from 'lucide-react';
import { dateCourte, euro, nombre, ratio } from '../lib';
import { joursDePeriode, periodeGlissante } from '../services/mesures';
import { Accord, DetailBloc, Fiche, Mini, type Decision } from './Fiche';
import { useStudio, type Lecture } from './donnees';
import {
  audiences,
  champs,
  comparaison,
  construireBloc,
  etapes,
  etatRendu,
  hierarchie,
  statutStudio,
  total,
  type Audience,
  type Axe,
  type Bloc,
  type Etape,
  type Ligne,
  type Mesure,
} from './modele';
import './studio.css';

const stages = Object.keys(etapes) as Etape[];
const cibles = Object.keys(audiences) as Audience[];
function Courbe({ mesures, jours }: { mesures: Mesure[]; jours: string[] }) {
  const serie = jours.slice(-7).map((j) => total(mesures.filter((m) => m.jour === j)).roas);
  const connus = serie.filter((x): x is number => x !== null);
  if (connus.length < 2) return null;
  const haut = Math.max(...connus),
    bas = Math.min(...connus);
  const y = (n: number) => (haut === bas ? 10 : 18 - (16 * (n - bas)) / (haut - bas));
  const trace = serie
    .map((n, i) =>
      n === null ? '' : (i === 0 || serie[i - 1] === null ? 'M' : 'L') + ' ' + i * 12 + ' ' + y(n),
    )
    .join(' ');
  return (
    <svg viewBox="0 0 75 20" role="img" aria-label="Tendance quotidienne du ROAS sur sept jours">
      <path d={trace} fill="none" stroke="currentColor" strokeWidth="1.6" />
      {serie.map((n, i) => n !== null && <circle key={i} cx={i * 12} cy={y(n)} r="1.4" />)}
    </svg>
  );
}
function CaseBloc({
  bloc,
  data,
  jours,
  ouvrir,
}: {
  bloc: Bloc;
  data: Lecture;
  jours: string[];
  ouvrir: (b: Bloc) => void;
}) {
  if (!bloc.rendus.length)
    return (
      <span className="mx-vide" aria-label="Aucune création">
        —
      </span>
    );
  const stats = total(bloc.mesures),
    comp = comparaison(bloc);
  const tests = bloc.rendus.filter(
    (r) =>
      etatRendu(
        r,
        bloc.mesures.filter((m) => m.id === r.id),
        jours[jours.length - 1],
      ) === 'En test',
  );
  const visuels = (tests.length ? tests : bloc.rendus).slice(0, 3);
  return (
    <button
      type="button"
      className={'mx-case ' + comp.ton}
      onClick={() => ouvrir(bloc)}
      aria-haspopup="dialog"
      aria-label={[
        bloc.titre,
        bloc.etape,
        audiences[bloc.audience],
        stats.achats == null ? 'Achats non mesurés' : nombre(stats.achats) + ' achats',
        comp.texte,
      ].join(' · ')}
    >
      <span className="mx-case-haut">
        <strong>{stats.achats == null ? '—' : nombre(stats.achats)}</strong>
        <span className="mx-vignettes">
          {visuels.map((r) => (
            <Mini key={r.id} rendu={r} data={data} />
          ))}
        </span>
      </span>
      <small>Achats Meta</small>
      <span className="mx-roas">
        <Courbe mesures={bloc.mesures} jours={jours} />
        <b>{ratio(stats.roas, 2)}</b>
      </span>
      <small>
        {stats.depense === null ? 'Dépense inconnue' : euro(stats.depense) + ' dépensés'}
        {tests.length > 0 && ' · ' + tests.length + ' en test'}
      </small>
    </button>
  );
}
function Grille({ data, jours, ouvrir }: { data: Lecture; jours: string[]; ouvrir: (b: Bloc) => void }) {
  const [axe, setAxe] = useState<Axe>('persona'),
    [filtre, setFiltre] = useState('');
  const [ouvert, setOuvert] = useState<Set<string>>(new Set());
  const personas = [
    ...new Set(data.creations.map((r) => r.persona).filter((v): v is string => !!v)),
  ].sort();
  const classes = data.creations.filter((r) => r.etape && (!filtre || r.persona === filtre));
  const lignes = hierarchie(classes, axe);
  function ligne(row: Ligne, niveau: number): JSX.Element {
    const ids = new Set(row.rendus.map((r) => r.id));
    const stats = total(data.mesures.filter((m) => ids.has(m.id) && m.audience));
    const deployee = ouvert.has(row.cle);
    return (
      <Fragment key={row.cle}>
        <tr>
          <th scope="row" style={{ paddingLeft: 10 + niveau * 10 }}>
            <small>{champs[row.champ]}</small>
            {row.enfants.length ? (
              <button
                aria-expanded={deployee}
                onClick={() =>
                  setOuvert((s) => {
                    const next = new Set(s);
                    if (next.has(row.cle)) next.delete(row.cle);
                    else next.add(row.cle);
                    return next;
                  })
                }
              >
                <ChevronRight size={15} style={{ transform: deployee ? 'rotate(90deg)' : undefined }} />
                {row.nom}
              </button>
            ) : (
              <b>{row.nom}</b>
            )}
            <small>
              {row.rendus.length} créa{row.rendus.length > 1 ? 's' : ''}
              {stats.roas !== null && ' · ROAS ' + ratio(stats.roas, 2)}
            </small>
          </th>
          {stages.flatMap((etape) =>
            cibles.map((a) => (
              <td key={etape + a}>
                <CaseBloc
                  bloc={construireBloc(row, etape, a, data)}
                  data={data}
                  jours={jours}
                  ouvrir={ouvrir}
                />
              </td>
            )),
          )}
        </tr>
        {deployee && row.enfants.map((r) => ligne(r, niveau + 1))}
      </Fragment>
    );
  }
  return (
    <>
      <div className="mx-outils">
        <div className="mx-segment" aria-label="Regrouper les lignes">
          {(['persona', 'angle'] as Axe[]).map((a) => (
            <button key={a} aria-pressed={axe === a} onClick={() => setAxe(a)}>
              Par {a}
            </button>
          ))}
        </div>
        {personas.length > 0 && (
          <label>
            Persona{' '}
            <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
              <option value="">Tous</option>
              {personas.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="mx-scroll" role="region" aria-label="Matrice des créations" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th rowSpan={2} scope="col">
                {champs[axe]}
              </th>
              {stages.map((e) => (
                <th key={e} scope="colgroup" colSpan={2}>
                  {e}
                  <small>{etapes[e]}</small>
                </th>
              ))}
            </tr>
            <tr>
              {stages.flatMap((e) =>
                cibles.map((a) => (
                  <th key={e + a} scope="col">
                    {audiences[a]}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>{lignes.map((r) => ligne(r, 0))}</tbody>
        </table>
      </div>
      {!lignes.length && (
        <p className="mx-note">
          Aucun rendu partagé ne dispose d’une étape de diffusion classée pour cette sélection.
        </p>
      )}
      <details className="mx-legende">
        <summary>Comment lire les blocs</summary>
        <p>
          Les achats et le ROAS sont attribués par Meta. La courbe couvre les sept derniers jours de la
          période. Le vert et l’ocre signalent un écart d’au moins 20 % avec les autres créations
          partagées de la même étape et audience, observées aux mêmes dates, phases et fenêtres
          d’attribution. En gris, la comparaison est insuffisante ou les résultats sont proches.
        </p>
      </details>
    </>
  );
}
function Accords({ data, ouvrir }: { data: Lecture; ouvrir: (d: Decision) => void }) {
  const liste: Decision[] = [
    ...data.briefs
      .filter((b) => b.statut_client === 'a_valider')
      .map((objet) => ({ type: 'brief' as const, objet })),
    ...data.creations
      .filter((c) => c.statut === 'a_valider')
      .map((objet) => ({ type: 'rendu' as const, objet })),
  ];
  return (
    <section className="mx-surface">
      <h2>
        Vos accords <small>{liste.length}</small>
      </h2>
      {!liste.length && <p className="mx-note">Tout est à jour.</p>}
      {liste.map((d) => (
        <button
          className="mx-ligne-rendu"
          key={d.type === 'brief' ? d.objet.campaign_id : d.objet.id}
          onClick={() => ouvrir(d)}
        >
          {d.type === 'rendu' ? <Mini rendu={d.objet} data={data} /> : <MessageSquare size={20} />}
          <span>
            <strong>{d.type === 'brief' ? d.objet.produit : d.objet.titre}</strong>
            <small>{d.type === 'brief' ? 'Relire le brief' : 'Valider le visuel'}</small>
          </span>
          <CheckCheck size={19} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}
export function Studio({ accueil = false }: { accueil?: boolean }) {
  const [duree, setDuree] = useState(30);
  const periode = periodeGlissante(duree);
  const jours = useMemo(() => joursDePeriode(periode), [periode.debut, periode.fin]);
  const { data, erreur, recharger } = useStudio(periode.debut, periode.fin);
  const [choix, setChoix] = useState<string | null>(null),
    [bloc, setBloc] = useState<Bloc | null>(null),
    [decision, setDecision] = useState<Decision | null>(null);
  if (!data)
    return (
      <div className="mx-surface mx-note" role="status">
        {erreur ?? 'Chargement du Studio…'}{' '}
        {erreur && (
          <button className="mx-lien" onClick={recharger}>
            Réessayer
          </button>
        )}
      </div>
    );
  const recents = data.creations.slice(0, 3),
    actuel = recents.find((r) => r.id === choix) ?? recents[0];
  const faits = actuel ? data.mesures.filter((m) => m.id === actuel.id) : [];
  const hors = data.creations.filter(
    (r) =>
      !r.etape ||
      (!r.cible && !data.mesures.some((m) => m.id === r.id && m.audience)) ||
      data.mesures.some((m) => m.id === r.id && !m.audience),
  );
  function fermer() {
    setDecision(null);
    setBloc(null);
  }
  return (
    <div className="mx-studio">
      {accueil ? (
        <>
          <Accords data={data} ouvrir={setDecision} />
          <section className="mx-surface">
            <header>
              <h2>Studio</h2>
              <Link to="/creations">
                Voir la matrice <ArrowRight size={16} />
              </Link>
            </header>
            {actuel ? (
              <div className="mx-selection">
                <button
                  className="mx-grand"
                  onClick={() => setDecision({ type: 'rendu', objet: actuel })}
                >
                  {actuel.apercu && data.images[actuel.apercu] ? (
                    <img src={data.images[actuel.apercu]} alt={actuel.titre} />
                  ) : (
                    <Grid2X2 size={42} />
                  )}
                </button>
                <div className="mx-editorial">
                  <small>{[actuel.persona, actuel.angle].filter(Boolean).join(' · ')}</small>
                  <h3>{actuel.titre}</h3>
                  <span className="mx-etat" data-etat={statutStudio(actuel, data, periode.fin)}>
                    {statutStudio(actuel, data, periode.fin)}
                  </span>
                  <p>
                    {total(faits).roas != null
                      ? 'ROAS ' + ratio(total(faits).roas, 2) + ' · ' + duree + ' jours'
                      : actuel.test_prevu_le
                        ? 'Test prévu le ' + dateCourte(actuel.test_prevu_le)
                        : actuel.format}
                  </p>
                </div>
                <div className="mx-choix">
                  {recents.map((r) => (
                    <button aria-pressed={r.id === actuel.id} key={r.id} onClick={() => setChoix(r.id)}>
                      <Mini rendu={r} data={data} />
                      <span>
                        {r.titre}
                        <small>{statutStudio(r, data, periode.fin)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mx-note">Les créations apparaissent ici dès leur partage par l’agence.</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mx-surface">
            <header>
              <h2>Matrice créative</h2>
              <label>
                Période{' '}
                <select
                  value={duree}
                  onChange={(e) => {
                    setDuree(Number(e.target.value));
                    fermer();
                  }}
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </label>
            </header>
            <Grille data={data} jours={jours} ouvrir={setBloc} />
            {hors.length > 0 && (
              <details className="mx-legende">
                <summary>Diffusion à préciser · {hors.length}</summary>
                {hors.map((r) => (
                  <button
                    className="mx-ligne-rendu"
                    key={r.id}
                    onClick={() => setDecision({ type: 'rendu', objet: r })}
                  >
                    <Mini rendu={r} data={data} />
                    <span>
                      {r.titre}
                      <small>
                        {r.etape ?? 'Étape à préciser'} · {r.format}
                      </small>
                    </span>
                  </button>
                ))}
              </details>
            )}
          </section>
          <Accords data={data} ouvrir={setDecision} />
        </>
      )}
      {decision ? (
        <Fiche
          key={decision.type === 'brief' ? decision.objet.campaign_id : decision.objet.id}
          titre={decision.type === 'brief' ? decision.objet.produit : decision.objet.titre}
          contexte={decision.type === 'brief' ? 'Brief partagé' : 'Rendu partagé'}
          fermer={() => setDecision(null)}
        >
          <Accord
            decision={decision}
            data={data}
            apres={() => {
              fermer();
              recharger();
            }}
          />
        </Fiche>
      ) : (
        bloc && (
          <Fiche
            titre={bloc.titre}
            contexte={bloc.etape + ' · ' + etapes[bloc.etape] + ' · ' + audiences[bloc.audience]}
            fermer={fermer}
          >
            <DetailBloc bloc={bloc} data={data} fin={periode.fin} ouvrir={setDecision} />
          </Fiche>
        )
      )}
    </div>
  );
}
