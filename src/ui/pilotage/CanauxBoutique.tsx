import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { useDonnees } from '../../donnees';
import { lireReportingClient, SOURCES_REPORTING, type ReportingClient, type SourceId } from '../../services/canauxReporting';
import { euro, nombre } from '../../lib';
const ADS: SourceId[] = ['meta','google','tiktok','pinterest'];
const ACTION_CANAL: Record<SourceId,string[]> = {meta:['meta'],google:['google'],tiktok:['tiktok'],pinterest:['pinterest'],search_console:['seo'],ga4:['analytics'],klaviyo:['email']};
export function CanauxBoutique() {
  const { marque, periode, actions, etapes } = useDonnees();
  const key=[marque?.id,periode.debut,periode.fin].join('/');
  const [resultat,setResultat]=useState<{key:string;data?:ReportingClient;error?:string}|null>(null);
  const [choix,setChoix]=useState<SourceId|null>(null);
  const [retry,setRetry]=useState(0);
  const dialog=useRef<HTMLDialogElement>(null);
  const titreDialog=useId();
  useEffect(()=>{let ignore=false;setResultat(null);setChoix(null);if(marque?.id) lireReportingClient(marque.id,periode).then(data=>{if(!ignore)setResultat({key,data});}).catch(()=>{if(!ignore)setResultat({key,error:'Le détail des canaux est indisponible.'});});return()=>{ignore=true;};},[key,marque?.id,periode.debut,periode.fin,retry]);
  useEffect(()=>{if(choix&&!dialog.current?.open)dialog.current?.showModal();else if(!choix&&dialog.current?.open)dialog.current.close();},[choix]);
  const data=resultat?.key===key?resultat.data:undefined;
  const erreur=resultat?.key===key?resultat.error:null;
  const rows=data?.mesures.filter(r=>r.plateforme===choix)??[];
  const report=data?.rapports.find(r=>r.plateforme===choix);
  const adRows=data?.publicite.filter(r=>r.plateforme===choix)??[];
  const sommePub=(field:'depense'|'impressions'|'clics'|'revenu_attribue')=>adRows.length&&adRows.every(r=>typeof r[field]==='number'&&Number.isFinite(r[field]))?adRows.reduce((s,r)=>s+r[field]!,0):null;
  const sum=(field:string)=>rows.length&&rows.every(r=>Number.isFinite(r.mesures[field]))?rows.reduce((a,r)=>a+r.mesures[field],0):null;
  const format=(value:number|null|undefined, money=false)=>typeof value==='number'&&Number.isFinite(value)?(money?euro(value):nombre(value)):'—';
  const impressions=sum('impressions');
  const nbJours=Math.round((Date.parse(periode.fin)-Date.parse(periode.debut))/86400000)+1;
  const joursCouverts=new Set(data?.couverture.filter(c=>c.plateforme===choix).map(c=>c.date)).size;
  let stats:{label:string;value:string}[]=[];
  if(choix&&ADS.includes(choix)&&adRows.length) stats=[
    {label:'Dépenses publicitaires',value:format(sommePub('depense'),true)},
    {label:'Impressions',value:format(sommePub('impressions'))},
    {label:'Clics',value:format(sommePub('clics'))},
    {label:'Revenu déclaré par la plateforme',value:format(sommePub('revenu_attribue'),true)},
  ];
  if(choix==='search_console'&&rows.length) stats=[{label:'Clics Google',value:format(sum('clics'))},{label:'Impressions',value:format(impressions)},{label:'Position moyenne',value:impressions!=null&&impressions>0&&rows.every(r=>Number.isFinite(r.mesures.position))?(rows.reduce((s,r)=>s+(r.mesures.position??0)*(r.mesures.impressions??0),0)/impressions).toLocaleString('fr-FR',{maximumFractionDigits:1}):'—'}];
  if(choix==='ga4'&&rows.length) stats=[{label:'Sessions',value:format(sum('sessions'))},{label:'Achats mesurés',value:format(sum('achats'))},{label:'Revenu déclaré GA4',value:format(sum('revenu_declare'),true)}];
  if(choix==='klaviyo'&&report?.rapport.totaux) stats=[{label:'E-mails délivrés',value:format(report.rapport.totaux.delivered)},{label:'Clics',value:format(report.rapport.totaux.clicks)},{label:'Revenu attribué Klaviyo',value:format(report.rapport.totaux.conversion_value,true)}];
  const current=choix?data?.etats.find(e=>e.plateforme===choix):undefined;
  const selectedActions=choix?actions.filter(a=>ACTION_CANAL[choix].includes(a.canal)&&a.date>=periode.debut&&a.date<=periode.fin):[];
  return <section className="mb-5 rounded-card border border-line bg-paper p-4" aria-label="Détail par canal"><h2 className="font-semibold mb-2">Canaux</h2>
    {erreur?<p role="alert" className="text-sm text-ink-muted">{erreur} <button type="button" className="underline" onClick={()=>setRetry(r=>r+1)}>Réessayer</button></p>:<div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-x-5">{Object.entries(SOURCES_REPORTING).map(([id,label])=>{const etat=data?.etats.find(e=>e.plateforme===id);return <button type="button" key={id} onClick={()=>setChoix(id as SourceId)} disabled={!data} className="flex justify-between gap-3 items-center text-left py-3 border-b border-line hover:text-red-ink disabled:opacity-50"><span className="text-sm">{label}<small className="block text-xs text-ink-muted mt-0.5">{!data?'Chargement…':etat?.active===false?'En pause':etat?.derniere_erreur?'À actualiser':etat?.statut==='connecte'?(etat.derniere_sync?'Connecté':'Synchronisation attendue'):'À connecter'}</small></span><ArrowUpRight className="w-4 h-4 shrink-0" /></button>;})}</div>}
    <dialog ref={dialog} aria-labelledby={titreDialog} onClose={()=>{if(!dialog.current?.open)setChoix(null);}} className="rounded-card border border-line bg-paper text-ink w-[calc(100%-24px)] max-w-xl p-0 max-h-[85vh] backdrop:bg-black/20"><header className="sticky top-0 flex justify-between items-center gap-3 p-5 bg-paper border-b border-line"><h2 id={titreDialog} className="font-semibold text-lg">{choix?SOURCES_REPORTING[choix]:''}</h2><button autoFocus type="button" onClick={()=>setChoix(null)} aria-label="Fermer le canal" className="p-2"><X className="w-4 h-4" /></button></header><div className="p-5">
      {current?.active===false&&<p className="text-sm mb-4 text-ink-muted">Cette source est en pause. Les mesures affichées sont historiques.</p>}
      {current?.derniere_erreur&&<p role="status" className="text-sm mb-4 text-ink-muted">La dernière actualisation a échoué. Les données ci-dessous sont celles déjà enregistrées.</p>}
      {stats.length?<dl className="divide-y divide-line">{stats.map(s=><div className="flex justify-between gap-3 py-3" key={s.label}><dt className="text-sm">{s.label}</dt><dd className="font-semibold tabular-nums whitespace-nowrap">{s.value}</dd></div>)}</dl>:<p className="text-sm text-ink-muted">{current?.statut==='connecte'?'Aucune mesure synchronisée pour cette période.':'Votre équipe doit connecter ce canal pour afficher ses résultats.'}</p>}
      {choix&&choix!=='klaviyo'&&stats.length>0&&joursCouverts<nbJours&&<p className="text-xs text-ink-muted mt-3">Période partielle · {joursCouverts}/{nbJours} jours vérifiés.</p>}
      <p className="text-xs text-ink-muted mt-4">{choix==='search_console'?'La visibilité Google ne permet pas de connaître le mot-clé de chaque acheteur.':'Ces revenus sont déclarés selon le modèle du canal. Ils ne se cumulent ni avec les ventes Shopify ni entre plateformes.'}</p>
      {report?.rapport.partiel&&<p className="text-xs text-ink-muted mt-2">Données partielles sur cette période.</p>}
      {report?.rapport.limites?.map(s=><p key={s} className="text-xs text-ink-muted mt-2">{s}</p>)}
      <h3 className="font-semibold mt-6 mb-2">Actions réalisées</h3>{selectedActions.length?<ul className="divide-y divide-line">{selectedActions.map(a=><li key={a.id} className="py-3 text-sm"><p>{a.action}</p>{a.resultat&&<p className="mt-1 text-ink-muted">{a.resultat}</p>}</li>)}</ul>:<p className="text-sm text-ink-muted">Aucune action enregistrée pour ce canal sur la période.</p>}
      {etapes.some(e=>e.statut!=='fait')&&<a href="/suivi" className="inline-block text-sm underline mt-5">Voir le planning</a>}
    </div></dialog>
  </section>;
}
