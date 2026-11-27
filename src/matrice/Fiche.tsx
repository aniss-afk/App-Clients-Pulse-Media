import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IcCoche as Check, IcCroix as X } from '../ui/IconesQG';
import { MessageSquare } from 'lucide-react';
import { dateCourte, euro, nombre, ratio } from '../lib';
import { supabase } from '../auth/supabase';
import { envoyerDemande } from '../services/espaceClient';
import { audiences, comparaison, etapes, etatRendu, total, type Bloc, type Rendu } from './modele';
import type { Brief, Lecture } from './donnees';

export function Fiche({
  titre,
  contexte,
  fermer,
  children,
}: {
  titre: string;
  contexte?: string;
  fermer: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    const el = dialog.current!;
    el.showModal();
    return () => {
      el.close();
      avant?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="mx-fiche"
      aria-labelledby="mx-titre"
      onCancel={(e) => {
        e.preventDefault();
        fermer();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) fermer();
      }}
    >
      <article>
        <header>
          <div>
            {contexte && <small>{contexte}</small>}
            <h2 id="mx-titre">{titre}</h2>
          </div>
          <button type="button" aria-label="Fermer" onClick={fermer}>
            <X size={20} />
          </button>
        </header>
        {children}
      </article>
    </dialog>
  );
}
type Decision = { type: 'brief'; objet: Brief } | { type: 'rendu'; objet: Rendu };
export function Accord({
  decision,
  data,
  apres,
}: {
  decision: Decision;
  data: Lecture;
  apres: () => void;
}) {
  const [reprendre, setReprendre] = useState(false),
    [motif, setMotif] = useState('');
  const [enCours, setEnCours] = useState(false),
    [erreur, setErreur] = useState('');
  const attente =
    decision.type === 'brief'
      ? decision.objet.statut_client === 'a_valider'
      : decision.objet.statut === 'a_valider';
  async function repondre(ok: boolean) {
    if (enCours || (!ok && motif.trim().length < 5)) return;
    setEnCours(true);
    setErreur('');
    try {
      const args = { p_decision: ok ? 'validee' : 'a_revoir', p_motif: ok ? null : motif.trim() };
      const res =
        decision.type === 'brief'
          ? await supabase.rpc('portail_decider_brief', {
              ...args,
              p_campaign: decision.objet.campaign_id,
              p_envoi: decision.objet.envoye_client_le,
            })
          : await supabase.rpc('decider_rendu_portail', {
              ...args,
              p_crea: decision.objet.id,
              p_envoi: decision.objet.partage,
            });
      if (res.error) throw res.error;
      apres();
    } catch {
      setErreur(
        'Décision non enregistrée. Fermez la fiche, rechargez puis vérifiez la dernière version.',
      );
    } finally {
      setEnCours(false);
    }
  }
  return (
    <>
      {decision.type === 'brief' ? (
        <div className="mx-brief">
          {[
            [
              'Angles',
              (decision.objet.angles ?? []).map((x) =>
                [x.titre, x.pourquoi].filter(Boolean).join(' · '),
              ),
            ],
            ['Accroches', (decision.objet.hooks ?? []).map((x) => x.texte)],
            [
              'Déroulé',
              (decision.objet.structure ?? []).map((x) =>
                [x.etape, x.duree, x.conseil].filter(Boolean).join(' · '),
              ),
            ],
            [
              'À éviter',
              (decision.objet.interdits ?? []).map((x) =>
                [x.quoi, x.pourquoi].filter(Boolean).join(' · '),
              ),
            ],
          ].map(
            ([titre, lignes]) =>
              Array.isArray(lignes) &&
              lignes.length > 0 && (
                <section key={String(titre)}>
                  <h3>{titre}</h3>
                  <ul>
                    {lignes.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      ) : (
        <RenduDetail rendu={decision.objet} data={data} />
      )}
      {attente && data.lectureSeule && (
        <p className="mx-note">Validation disponible après la mise à jour du portail.</p>
      )}
      {attente && !data.lectureSeule && (
        <section>
          <h3>Votre accord</h3>
          {reprendre && (
            <label>
              Changements demandés
              <textarea
                rows={3}
                minLength={5}
                maxLength={1000}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
              />
            </label>
          )}
          <div className="mx-actions">
            {!reprendre && (
              <button className="mx-primaire" disabled={enCours} onClick={() => void repondre(true)}>
                <Check size={16} /> Valider {decision.type === 'brief' ? 'le brief' : 'le rendu'}
              </button>
            )}
            <button
              disabled={enCours || (reprendre && motif.trim().length < 5)}
              onClick={() => (reprendre ? void repondre(false) : setReprendre(true))}
            >
              <MessageSquare size={16} />
              {reprendre ? 'Envoyer la demande' : 'Demander une reprise'}
            </button>
            {reprendre && (
              <button disabled={enCours} onClick={() => setReprendre(false)}>
                Annuler
              </button>
            )}
          </div>
        </section>
      )}
      {erreur && <p role="alert">{erreur}</p>}
    </>
  );
}
function RenduDetail({ rendu: r, data }: { rendu: Rendu; data: Lecture }) {
  return (
    <section>
      {r.fichiers.map(
        (f) =>
          data.images[f] &&
          (r.format === 'video' ? (
            <video key={f} src={data.images[f]} controls playsInline preload="metadata" />
          ) : (
            <img className="mx-rendu" key={f} src={data.images[f]} alt={r.titre} />
          )),
      )}
      {!r.fichiers.some((f) => data.images[f]) &&
        (r.apercu && data.images[r.apercu] ? (
          <img className="mx-rendu" src={data.images[r.apercu]} alt={r.titre} />
        ) : (
          <p>Aperçu indisponible.</p>
        ))}
      <p>{[r.persona, r.angle, r.format].filter(Boolean).join(' · ')}</p>
    </section>
  );
}
export function MesuresBloc({ mesures }: { mesures: Bloc['mesures'] }) {
  const m = total(mesures);
  return (
    <dl className="mx-mesures">
      {[
        ['Achats Meta', m.achats == null ? '—' : nombre(m.achats)],
        ['ROAS Meta', ratio(m.roas, 2)],
        ['Dépense', m.depense == null ? '—' : euro(m.depense)],
      ].map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
export function DetailBloc({
  bloc,
  data,
  fin,
  ouvrir,
}: {
  bloc: Bloc;
  data: Lecture;
  fin: string;
  ouvrir: (decision: Decision) => void;
}) {
  const lecture = comparaison(bloc);
  const temoin = [...bloc.rendus]
    .filter((r) => bloc.mesures.some((m) => m.id === r.id))
    .sort(
      (a, b) =>
        (total(bloc.mesures.filter((m) => m.id === b.id)).depense ?? 0) -
        (total(bloc.mesures.filter((m) => m.id === a.id)).depense ?? 0),
    )[0];
  const piste =
    temoin &&
    (lecture.ton === 'positif'
      ? 'Reprendre « ' +
        temoin.titre +
        ' » et ne changer que l’accroche. Comparer les achats à audience et budget comparables.'
      : lecture.ton === 'surveiller'
        ? 'Tester une autre preuve dans « ' +
          temoin.titre +
          ' » en gardant la même offre et la même audience.'
        : 'Conserver « ' +
          temoin.titre +
          ' » comme témoin et attendre davantage de résultats comparables avant de choisir une variante.');

  const [idee, setIdee] = useState(''),
    [statut, setStatut] = useState(''),
    [enCours, setEnCours] = useState(false);
  async function proposer() {
    setEnCours(true);
    try {
      await envoyerDemande([bloc.titre, bloc.etape, audiences[bloc.audience], idee.trim()].join(' · '));
      setIdee('');
      setStatut('Idée envoyée à l’agence.');
    } catch {
      setStatut('Envoi impossible. Votre idée est conservée ici.');
    } finally {
      setEnCours(false);
    }
  }
  return (
    <>
      <MesuresBloc mesures={bloc.mesures} />
      <p className="mx-note">
        {lecture.texte}
        {lecture.roas !== null && ' · ROAS des autres créations comparables ' + ratio(lecture.roas, 2)}.
      </p>
      <section>
        <h3>Créations du bloc</h3>
        {bloc.rendus.map((r) => {
          const faits = bloc.mesures.filter((m) => m.id === r.id),
            bilan = total(faits);
          return (
            <button
              className="mx-ligne-rendu"
              key={r.id}
              onClick={() => ouvrir({ type: 'rendu', objet: r })}
            >
              <Mini rendu={r} data={data} />
              <span>
                <strong>{r.titre}</strong>
                <small>
                  {etatRendu(r, faits, fin)} · {r.format}
                  {r.changement && ' · Variante ' + r.changement}
                </small>
              </span>
              <span>
                {bilan.roas === null ? '' : ratio(bilan.roas, 2)}
                <small>{bilan.achats === null ? '' : nombre(bilan.achats) + ' achats'}</small>
              </span>
            </button>
          );
        })}
      </section>
      <section>
        <h3>Prochain test</h3>
        {piste && (
          <p className="mx-note">
            <strong>Piste à discuter</strong> · {piste}
          </p>
        )}
        {bloc.rendus
          .filter((r) => r.test_prevu_le && r.test_prevu_le > fin)
          .map((r) => (
            <p key={r.id}>
              {r.titre} · prévu le {dateCourte(r.test_prevu_le)}
            </p>
          ))}
        {data.briefs
          .filter(
            (b) => b.statut_client === 'a_valider' && bloc.rendus.some((r) => r.brief === b.campaign_id),
          )
          .map((b) => (
            <button
              key={b.campaign_id}
              className="mx-lien"
              onClick={() => ouvrir({ type: 'brief', objet: b })}
            >
              Lire et valider le brief · {b.produit}
            </button>
          ))}
        <details>
          <summary>Proposer une idée à l’agence</summary>
          <label>
            Votre idée pour {bloc.titre.toLowerCase()}
            <textarea
              value={idee}
              rows={3}
              maxLength={800}
              onChange={(e) => setIdee(e.target.value)}
              placeholder={'Quelle variante tester en ' + etapes[bloc.etape].toLowerCase() + ' ?'}
            />
          </label>
          <button
            className="mx-primaire"
            disabled={enCours || idee.trim().length < 10}
            onClick={() => void proposer()}
          >
            Envoyer l’idée
          </button>
          <p role="status">{statut}</p>
        </details>
      </section>
    </>
  );
}
export function Mini({ rendu, data }: { rendu: Rendu; data: Lecture }) {
  const src = rendu.apercu && data.images[rendu.apercu];
  return src ? (
    <img className="mx-mini" src={src} loading="lazy" alt="" />
  ) : (
    <span className="mx-mini mx-initiale" aria-hidden="true">
      {rendu.titre.slice(0, 1)}
    </span>
  );
}
export type { Decision };
