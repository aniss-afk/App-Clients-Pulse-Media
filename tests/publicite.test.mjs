import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';

test('Meta, Google, Pinterest et TikTok restent distincts du CA encaissé', async (t) => {
  const serveur = await createServer({server:{middlewareMode:true, hmr:{server:createHttpServer()}},appType:"custom"});
  t.after(() => serveur.close());
  const {bilan,NOM_PLATEFORME} = await serveur.ssrLoadModule('/src/services/espaceClient.ts');
  const date = '2026-09-01';
  const metriques = ['meta','google','pinterest','tiktok'].map((plateforme, i) => ({
    clientId:'A', plateforme, date, depense:10, revenuAttribue:20 + i, conversions:1, impressions:100, clics:10,
  }));
  const res = bilan(metriques, [{clientId:'A', date, ca:70, commandes:2, nouveauxClients:1}], {debut:date,fin:date}, 'A');
  assert.deepEqual(Object.keys(res.depenseParPlateforme).sort(), ['google','meta','pinterest','tiktok']);
  assert.equal(NOM_PLATEFORME.pinterest, 'Pinterest Ads');
  assert.equal(res.ca, 70);
  assert.equal(res.depense, 40);
  assert.equal(res.revenuAttribue, 86);
  assert.equal(res.revenuParPlateforme.pinterest, 22);
  assert.equal(res.roasParPlateforme.pinterest, 2.2);
  assert.equal(res.mer, 1.75);
});
