import { useMemo, useState } from 'react';
import { useDonnees } from '../donnees';
import { Entete, Statut, Vide, Zone } from '../ui/pieces';
import { NOM_CANAL, repondreSuivi, type SuiviClient } from '../services/espaceClient';
import { dateLongue, euro } from '../lib';

/**
 * Une frise, du passé au prévu.
 *
 * « Journal » et « Roadmap » étaient deux pages pour une même ligne du
 * temps : ce que l'agence a fait d'un côté, ce qu'elle va faire de
 * l'autre, et à la marque de deviner de quel côté chercher. Elles se
 * rejoignent ici, dans le même ordre, avec un repère à aujourd'hui.
 *
 * Le passé reste visible : c'est lui qui rend le futur crédible.
 */

type Ligne = {
  cle: string;
  date: string;
  titre: string;
  detail: string;
  /* Une étape de la feuille de route, ou une action menée sur le
     compte. Les deux se lisent dans la même colonne mais ne se
     confondent pas : l'une est une promesse, l'autre un fait. */
  genre: 'etape' | 'action';
  statut?: string;
  marge?: string | null;
};

export function Suivi() {
  const { etapes, actions, campagnes, chargement, suivi, rapports, recharger } = useDonnees();

  const produitDe = useMemo(() => new Map(campagnes.map((c) => [c.id, c.produit])), [campagnes]);

  const lignes = useMemo<Ligne[]>(() => {
    const desEtapes: Ligne[] = etapes.map((e) => ({
      cle: `e-${e.id}`,
      date: e.date,
      titre: e.titre,
      detail: e.detail,
      genre: 'etape',
      statut: e.statut,
      marge: e.campagneId ? produitDe.get(e.campagneId) ?? null : null,
    }));
    const desActions: Ligne[] = actions.map((a) => ({
      cle: `a-${a.id}`,
      date: a.date,
      titre: a.action,
      /* La raison d'abord, le résultat ensuite : c'est l'ordre dans
         lequel on décide, et celui dans lequel ça se relit. */
      detail: a.resultat ? `${a.raison}\n→ ${a.resultat}` : a.raison,
      genre: 'action',
      marge: NOM_CANAL[a.canal],
    }));
    return [...desEtapes, ...desActions].sort((x, y) => (x.date < y.date ? 1 : -1));
  }, [etapes, actions, produitDe]);

  if (chargement) return <Vide>Chargement…</Vide>;

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const aVenir = lignes.filter((l) => l.date > aujourdHui).reverse();
  const passees = lignes.filter((l) => l.date <= aujourdHui);

  return (
    <>
      <Entete titre="Suivi" sous="Ce qui est prévu, ce qui a été fait, dans l'ordre." />

      <Zone titre="Demandes de l'agence" compte={suivi.filter(x => x.statut === 'ouverte').length}>
        {suivi.length === 0 ? <Vide>Aucune demande partagée.</Vide> : <ul className="divide-y divide-line">{suivi.map(l => <LigneSuivi key={`${l.type}-${l.id}`} ligne={l} onFait={recharger} />)}</ul>}
      </Zone>
      <Zone titre="Rapports partagés" compte={rapports.length}>
        {rapports.length === 0 ? <Vide>Aucun rapport publié par l'agence.</Vide> : <ul className="divide-y divide-line">{rapports.map(r => <li key={r.id} className="px-5 py-4"><details><summary className="cursor-pointer font-medium">Rapport {r.periode === 'hebdo' ? 'hebdomadaire' : 'mensuel'} · {dateLongue(r.debut)} → {dateLongue(r.fin)}</summary><p className="mt-3 whitespace-pre-wrap text-sm">{r.contenu ?? 'Le rapport est disponible dans le document joint.'}</p>{r.drive_url?.startsWith('https://') && <a className="text-sm underline" href={r.drive_url} target="_blank" rel="noopener noreferrer">Ouvrir le document</a>}</details></li>)}</ul>}
      </Zone>
      <Zone titre="Campagnes" compte={campagnes.length}>
        {campagnes.length === 0 ? (
          <Vide>Aucune campagne pour le moment.</Vide>
        ) : (
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
        )}
      </Zone>

      <Zone titre="À venir" compte={aVenir.length}>
        {aVenir.length === 0 ? <Vide>Rien de planifié.</Vide> : <Frise lignes={aVenir} />}
      </Zone>

      <Zone titre="Déjà fait" compte={passees.length}>
        {passees.length === 0 ? <Vide>Rien encore.</Vide> : <Frise lignes={passees} passe />}
      </Zone>
    </>
  );
}

function Frise({ lignes, passe = false }: { lignes: Ligne[]; passe?: boolean }) {
  return (
    <ol className="px-5 py-5">
      {lignes.map((l, i) => (
        <li key={l.cle} className="flex gap-5">
          {/* Le fil et la pastille : le rouge marque ce qui est en cours,
              rien d'autre, sinon il ne marque plus rien. Une pastille
              creuse pour une action déjà menée, pleine pour une étape :
              on distingue le fait de la promesse sans une légende. */}
          <div className="flex flex-col items-center shrink-0 w-3">
            <span
              className={`w-3 h-3 rounded-pill mt-1.5 ${
                l.statut === 'en_cours'
                  ? 'bg-red'
                  : l.genre === 'action'
                    ? 'border-2 border-ink/30'
                    : passe
                      ? 'bg-ink/30'
                      : 'bg-ink/15 border border-line-strong'
              }`}
            />
            {i < lignes.length - 1 && <span className="w-px flex-1 bg-line my-1.5" />}
          </div>
          <div className={`pb-6 min-w-0 ${passe ? 'opacity-80' : ''}`}>
            <div className="text-sm text-ink-faint tabular-nums">{dateLongue(l.date)}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              <span className="text-base font-medium">{l.titre}</span>
              {l.marge && <span className="text-xs text-ink-faint">{l.marge}</span>}
            </div>
            <p className="text-sm text-ink-muted mt-1 whitespace-pre-line leading-relaxed">{l.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LigneSuivi({ligne:l,onFait}:{ligne:SuiviClient;onFait:()=>Promise<void>}) {
  const [motif,setMotif]=useState(''); const [erreur,setErreur]=useState(''); const [envoi,setEnvoi]=useState(false);
  async function repondre(decision:'valider'|'refuser'|'terminer') { setEnvoi(true);setErreur('');try {await repondreSuivi(l.type,l.id,decision,motif);await onFait();}catch(e){setErreur((e as Error).message);}finally{setEnvoi(false);} }
  const actionnable=l.statut==='ouverte' && (l.genre==='a_valider'||l.genre==='attente_marque');
  return <li className="px-5 py-4"><p className="font-medium">{l.titre}</p>{l.detail && <p className="text-sm text-ink-muted whitespace-pre-line">{l.detail}</p>}<p className="text-xs text-ink-faint mt-1">{l.echeance ? `Échéance : ${dateLongue(l.echeance)} · `:''}{({ouverte:'En attente',validee:'Validée',refusee:'Retour envoyé',terminee:'Terminée',ecartee:'Écartée'} as Record<string,string>)[l.statut] ?? l.statut}</p>{l.reponse && <p className="text-sm mt-2">Votre réponse : {l.reponse}</p>}{actionnable && <div className="mt-3 flex flex-wrap gap-3 items-center">{l.genre==='a_valider' ? <><button disabled={envoi} type="button" onClick={()=>void repondre('valider')} className="text-sm underline">Valider</button><label className="text-sm">Votre retour <input value={motif} onChange={e=>setMotif(e.target.value)} className="border border-line rounded-box p-2" /></label><button disabled={envoi} type="button" onClick={()=>void repondre('refuser')} className="text-sm underline">Demander une modification</button></>:<button disabled={envoi} type="button" onClick={()=>void repondre('terminer')} className="text-sm underline">C'est fait</button>}</div>}{erreur && <p role="alert" className="text-sm text-red-ink mt-2">{erreur}</p>}</li>;
}
