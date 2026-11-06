import assert from 'node:assert/strict';
import test from 'node:test';
import { bilanValide, cumulFinance, montantFinance } from '../src/services/financeModel.ts';
const base = {currency:'EUR',salesCents:10000,costsCents:6000,profitCents:4000,marginPct:40,coverage:{salesComplete:true,costsComplete:true,missing:[]},sources:[],expenses:[],trend:[]};
test('Un bilan incomplet ne peut annoncer ni bénéfice ni marge',()=>{
  for(const field of ['salesComplete','costsComplete']) {
    const r=bilanValide({...base,coverage:{...base.coverage,[field]:false}});
    assert.equal(r.profitCents,null);assert.equal(r.marginPct,null);
  }
  assert.equal(bilanValide(base).profitCents,4000);
  assert.throws(()=>bilanValide({...base,currency:'USD'}));
});
test('les détails et la courbe ne réintroduisent pas des valeurs non certifiées', () => {
  const donnees = {
    ...base, sources: [{id:'seo',label:'SEO',amountCents:10000}],
    expenses: [{id:'products',label:'Produits',amountCents:6000,complete:false,source:'Shopify'}],
    trend: [{date:'2026-11-01',salesCents:10000,costsCents:6000,profitCents:4000}],
    coverage:{salesComplete:false,costsComplete:false,missing:['Période incomplète']},
  };
  const resultat = bilanValide(donnees);
  assert.equal(resultat.sources[0].amountCents,null);
  assert.equal(resultat.expenses[0].amountCents,null);
  assert.equal(resultat.trend[0].salesCents,null);
  assert.equal(resultat.trend[0].profitCents,null);
  assert.equal(bilanValide({...base,salesCents:NaN}).profitCents,null);
  assert.equal(bilanValide({...base,salesCents:0}).marginPct,null);
  assert.throws(()=>bilanValide({...base,coverage:{salesComplete:'true',costsComplete:true,missing:[]}}));
});
test('Le cumul conserve les jours inconnus au lieu de les additionner comme zéro',()=>{
  const points=[{date:'2026-11-03',salesCents:100,costsCents:200,profitCents:-100},{date:'2026-11-01',salesCents:200,costsCents:100,profitCents:100},{date:'2026-11-02',salesCents:null,costsCents:100,profitCents:null}];
  const result=cumulFinance(points);
  assert.deepEqual(result.map(r=>r.salesCents),[200,null,null]);
  assert.deepEqual(result.map(r=>r.costsCents),[100,200,400]);
  assert.equal(result[2].profitCents,null);
  assert.equal(points[0].date,'2026-11-03');
  assert.equal(montantFinance(null),'—');assert.equal(montantFinance(NaN),'—');
  assert.match(montantFinance(0),/0/);assert.match(montantFinance(-100),/-1/);
});
