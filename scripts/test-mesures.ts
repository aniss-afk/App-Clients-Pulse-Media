import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GraphiqueDepenseCa } from '../src/ui/Graphique';
import { lireHistorique } from '../src/services/pagination';
import { fileURLToPath } from 'node:url';
import {
  bilan, couvertureTexte, decalerJour, joursDePeriode, nombreJours, periodeDuMois,
  periodeGlissante, periodeMoisPrecedent, periodePrecedente, periodeRapport,
  serieJournaliere, synthese, variationsComparables,
} from '../src/services/mesures';
import type { CaJour, MetriqueJour, Periode, Plateforme } from '../src/services/espaceClient';

const p: Periode = { debut: '2026-11-01', fin: '2026-11-10' };
const avant = { debut: '2026-10-01', fin: '2026-10-10' };
const caDe = (periode: Periode, montant = 100): CaJour[] => joursDePeriode(periode).map(date => ({date,ca:montant,commandes:2,nouveauxClients:1}));
const pubDe = (periode: Periode, plateforme: Plateforme = 'meta', depense = 20): MetriqueJour[] => joursDePeriode(periode).map(date => ({date,plateforme,depense,impressions:100,clics:10,conversions:2,revenuAttribue:100}));
let n=0;
function test(titre: string, verifier: () => void) { verifier(); n++; console.log(`✓ ${titre}`); }

test('30 jours UTC terminés et précédent sans chevauchement, même aux changements d’heure',()=>{
  for (const maintenant of ['2026-03-29T00:15:00Z','2026-03-30T00:15:00Z','2026-10-25T00:15:00Z','2026-10-26T00:15:00Z','2026-11-11T23:45:00Z']) {
    const date=new Date(maintenant),courant=periodeGlissante(30,date),precedent=periodePrecedente(courant);
    assert.equal(nombreJours(courant),30);assert.equal(nombreJours(precedent),30);
    assert.equal(courant.fin,decalerJour(maintenant.slice(0,10),-1));
    assert.equal(courant.debut,decalerJour(precedent.fin,1));
    assert.equal(new Set([...joursDePeriode(courant),...joursDePeriode(precedent)]).size,60);
  }
  assert.deepEqual(periodeGlissante(30,new Date('2026-11-11T10:00:00Z')),{debut:'2026-10-12',fin:'2026-11-10'});
  assert.deepEqual(periodeGlissante(7,new Date('2026-11-01T00:30:00+01:00')),{debut:'2026-10-24',fin:'2026-10-30'});
});

test('mois courant comparable aux mêmes jours terminés du mois précédent',()=>{
  const courant=periodeRapport('2026-11',new Date('2026-11-11T10:00:00Z'));
  assert.deepEqual(courant,p);assert.deepEqual(periodeMoisPrecedent(courant),avant);
  const cc=bilan(pubDe(p),caDe(p),p),pp=bilan(pubDe(avant),caDe(avant),avant);
  assert.deepEqual(variationsComparables(cc,pp),{ca:0,depense:0,mer:0});
});

test('29 février et mois plus court : pas de dates inventées ni de mois mélangés',()=>{
  assert.deepEqual(periodeDuMois('2024-02'),{debut:'2024-02-01',fin:'2024-02-29'});
  assert.deepEqual(periodeDuMois('2026-02'),{debut:'2026-02-01',fin:'2026-02-28'});
  assert.deepEqual(periodeMoisPrecedent({debut:'2024-03-01',fin:'2024-03-29'}),{debut:'2024-02-01',fin:'2024-02-29'});
  assert.equal(periodeMoisPrecedent({debut:'2026-03-01',fin:'2026-03-29'}),null);
  assert.equal(periodeMoisPrecedent({debut:'2026-03-01',fin:'2026-03-31'}),null);
  assert.throws(()=>periodeDuMois('2026-13'),/Mois invalide/);
  assert.throws(()=>periodeDuMois('quelconque'),/Mois invalide/);
});

test('premier jour du mois et mois futur restent vides, sans zéro présenté comme mesure',()=>{
  const vide=periodeRapport('2026-11',new Date('2026-11-01T10:00:00Z'));
  assert.equal(nombreJours(vide),0);assert.equal(periodeMoisPrecedent(vide),null);
  assert.equal(nombreJours(periodeRapport('2026-12',new Date('2026-11-11T10:00:00Z'))),0);
  const b=bilan([],[],vide);assert.equal(b.mer,null);assert.equal(b.nouveauxClients,null);assert.equal(couvertureTexte(b,'ca'),'Données non reçues');
});

test('27 jours contre 3 jours ne produit plus une hausse fictive',()=>{
  const courant=periodeGlissante(30,new Date('2026-11-11T10:00:00Z')),precedent=periodePrecedente(courant);
  const b=bilan(pubDe(courant).slice(3),caDe(courant).slice(3),courant);
  const a=bilan(pubDe(precedent).slice(27),caDe(precedent).slice(27),precedent);
  assert.equal(b.couverture.joursCa,27);assert.equal(a.couverture.joursCa,3);
  assert.deepEqual(variationsComparables(b,a),{ca:null,depense:null,mer:null});
  assert.equal(couvertureTexte(b,'ca'),'27/30 jours reçus');
  assert.deepEqual(synthese(b,a,[],[],courant),[]);
});

test('une lacune intermédiaire invalide la comparaison même si les bornes sont présentes',()=>{
  const rows=caDe(p).filter(x=>x.date!=='2026-11-05');
  const b=bilan(pubDe(p),rows,p),a=bilan(pubDe(avant),caDe(avant),avant);
  assert.equal(b.couverture.caComplete,false);assert.equal(b.mer,null);assert.equal(b.cpa,null);
  assert.equal(variationsComparables(b,a).ca,null);
  assert.equal(serieJournaliere(pubDe(p),rows,p).find(x=>x.date==='2026-11-05')!.ca,null);
});

test('un canal manquant un jour ne devient ni dépense zéro ni retour amélioré',()=>{
  const pubs=[...pubDe(p),...pubDe(p,'google').filter(x=>x.date!=='2026-11-05')];
  const b=bilan(pubs,caDe(p),p);
  assert.equal(b.couverture.joursPub,9);assert.equal(b.couverture.pubComplete,false);assert.equal(b.mer,null);
  const serie=serieJournaliere(pubs,caDe(p),p);assert.equal(serie.find(x=>x.date==='2026-11-05')!.depense,null);
  assert.equal(serie.find(x=>x.date==='2026-11-04')!.depense,40);
});

test('périmètre publicitaire différent : pas de delta entre un et deux canaux',()=>{
  const b=bilan(pubDe(p),caDe(p),p),a=bilan([...pubDe(avant),...pubDe(avant,'google')],caDe(avant),avant);
  assert.deepEqual(variationsComparables(b,a),{ca:0,depense:null,mer:null});
});

test('zéro reçu reste zéro ; source absente reste inconnue dans la série et les ratios',()=>{
  const zero=bilan(pubDe(p,'meta',0),caDe(p,0),p);assert.equal(zero.couverture.caComplete,true);assert.equal(zero.ca,0);assert.equal(zero.depense,0);
  const caSeul=serieJournaliere([],caDe(p),p);assert.equal(caSeul[0].depense,null);
  const pubSeule=serieJournaliere(pubDe(p),[],p);assert.equal(pubSeule[0].ca,null);
  assert.deepEqual(serieJournaliere([],[],p),[]);
  assert.equal(bilan([],caDe(p),p).mer,null);assert.equal(bilan(pubDe(p),[],p).cpa,null);
});

test('doublons, inconnus et valeurs invalides ne rendent pas la couverture complète',()=>{
  assert.equal(bilan(pubDe(p),[...caDe(p),caDe(p)[0]],p).couverture.caComplete,false);
  const pubs=pubDe(p);pubs[4].depense=NaN;const b=bilan(pubs,caDe(p),p);
  assert.equal(b.couverture.pubComplete,false);assert.equal(b.mer,null);
  const nouveaux=caDe(p);nouveaux[4].nouveauxClients=null;assert.equal(bilan(pubDe(p),nouveaux,p).cpa,null);
});

test('absence de référence comparable ne devient pas « stable » dans le texte',()=>{
  const b=bilan(pubDe(p),caDe(p),p),a=bilan([],[],avant);
  const texte=synthese(b,a,[],[],p).join(' ');
  assert.ok(texte.includes('1 000'));assert.ok(!/stable|hausse|baisse/.test(texte));
});

test('le graphique garde les trous et les retours négatifs sans géométrie invalide',()=>{
  const points=[{date:'2026-11-01',ca:100,depense:20},{date:'2026-11-02',ca:null,depense:null},{date:'2026-11-03',ca:-50,depense:0}];
  const html=renderToStaticMarkup(createElement(GraphiqueDepenseCa,{points}));
  assert.ok(!/NaN|Infinity|undefined/.test(html));
  assert.match(html,/<path d="M [^"]* M /);
  assert.ok(!/height="-/.test(html));
  assert.ok(html.includes('— de ventes'));
  const vide=renderToStaticMarkup(createElement(GraphiqueDepenseCa,{points:[]}));
  assert.ok(vide.includes('Aucune donnée'));
});

async function testAsync(titre: string, verifier: () => Promise<void>) { await verifier(); n++; console.log(`✓ ${titre}`); }
await testAsync('historique de 1500 lignes avec serveur limité à 500 : aucune page perdue',async()=>{
  const demandes:number[]=[];
  const rows=await lireHistorique(async(debut,fin)=>{
    demandes.push(debut);assert.equal(fin,debut+999);
    return {data:Array.from({length:Math.min(500,1500-debut)},(_,i)=>({id:debut+i})),count:1500,error:null};
  });
  assert.equal(rows.length,1500);assert.equal(rows.at(-1)!.id,1499);assert.deepEqual(demandes,[0,500,1000]);
});
await testAsync('une page manquante ou en erreur ne publie pas un historique partiel',async()=>{
  await assert.rejects(lireHistorique(async debut=>debut===0
    ? {data:[1],count:2,error:null}
    : {data:null,count:2,error:{message:'Page suivante refusée'}}),/Page suivante refusée/);
  await assert.rejects(lireHistorique(async debut=>({data:debut===0?[1]:[],count:2,error:null})),/incomplet/);
});
await testAsync('total absent ou changeant bloque ; zéro prouvé reste une liste vide',async()=>{
  assert.deepEqual(await lireHistorique(async()=>({data:[],count:0,error:null})),[]);
  await assert.rejects(lireHistorique(async()=>({data:[],count:null,error:null})),/nombre de lignes/);
  await assert.rejects(lireHistorique(async debut=>({data:[1],count:debut===0?2:3,error:null})),/changé/);
});

console.log(`${n} scénarios mesures client validés (${process.env.TZ ?? 'fuseau système'}).`);
if(!process.argv.includes('--zone')) {
  for(const TZ of ['UTC','Europe/Paris','America/Los_Angeles']) {
    execFileSync(process.execPath,[fileURLToPath(import.meta.url),'--zone'],{env:{...process.env,TZ},stdio:'pipe'});
    console.log(`✓ mêmes résultats en ${TZ}`);
  }
}
