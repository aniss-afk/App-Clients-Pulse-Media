import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';

test('les canaux sont bornés à la marque et la période, couverture paginée sans inventer de zéro', async t => {
  const serveur = await createServer({server:{middlewareMode:true,hmr:{server:createHttpServer()}},appType:'custom'});
  const initialFetch = globalThis.fetch;
  t.after(async () => { globalThis.fetch = initialFetch; await serveur.close(); });
  const urls = [];
  let echec = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input)); urls.push(url);
    if (url.pathname.endsWith('/rpc/sources_reporting')) {
      assert.equal(JSON.parse(init.body).p_client, 'marque-a');
      return Response.json([]);
    }
    assert.equal(url.searchParams.get('client_id'), 'eq.marque-a');
    if (url.pathname.endsWith('/source_rapports')) {
      assert.equal(url.searchParams.get('debut'), 'eq.2026-01-01');
      assert.equal(url.searchParams.get('fin'), 'eq.2026-06-30');
      return Response.json([]);
    }
    assert.deepEqual(url.searchParams.getAll('date'), ['gte.2026-01-01','lte.2026-06-30']);
    if (url.pathname.endsWith('/source_couverture')) {
      if (echec) return Response.json({message:'Lecture refusée'},{status:403});
      const debut = Number(url.searchParams.get('offset') || 0);
      return Response.json(Array.from({length:Math.min(500,Math.max(0,1107-debut))},(_,i)=>({plateforme:'meta',date:String(debut+i)})));
    }
    if (url.pathname.endsWith('/metriques_jour')) return Response.json([{plateforme:'meta',date:'2026-01-01',depense:null,impressions:0,clics:0,revenu_attribue:null}]);
    return Response.json([]);
  };
  const { lireReportingClient } = await serveur.ssrLoadModule('/src/services/canauxReporting.ts');
  const resultat = await lireReportingClient('marque-a',{debut:'2026-01-01',fin:'2026-06-30'});
  assert.equal(resultat.couverture.length,1107);
  assert.equal(resultat.publicite[0].depense,null);
  assert.equal(resultat.publicite[0].impressions,0);
  assert.equal(urls.filter(u=>u.pathname.endsWith('/source_couverture')).length,3);
  echec = true;
  await assert.rejects(lireReportingClient('marque-a',{debut:'2026-01-01',fin:'2026-06-30'}));
});
