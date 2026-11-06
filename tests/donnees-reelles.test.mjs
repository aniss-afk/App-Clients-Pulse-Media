import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';

const serveur = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom' });
const originalFetch = globalThis.fetch;
let reponse;
globalThis.fetch = async (...args) => {
  if (!reponse) throw new Error('Requête non prévue');
  return reponse(...args);
};
const service = await serveur.ssrLoadModule('/src/services/espaceClient.ts');
const { messageBoutique } = await serveur.ssrLoadModule('/src/services/etatBoutique.ts');
const { supabase } = await serveur.ssrLoadModule('/src/auth/supabase.ts');
const sessionReelle = supabase.auth.getSession;
after(async () => {
  supabase.auth.getSession = sessionReelle;
  globalThis.fetch = originalFetch;
  await serveur.close();
});

test('un compte vide conserve ses listes vides et sa fiche absente', async () => {
  reponse = () => Response.json([]);
  for (const lire of [
    service.getCampagnes, service.getCreations, service.getCreateurs, service.getProfils,
    service.getEtapes, service.getMetriques, service.getCa, service.getActions,
    service.getDemandes, service.getDocuments, service.connexionsBoutique,
  ]) assert.deepEqual(await lire(), []);
  assert.equal(await service.getMarque(), null);
});

test('les erreurs de lecture et les écritures refusées remontent au portail', async () => {
  reponse = () => Response.json({ message: 'permission refusée' }, { status: 403 });
  await assert.rejects(service.getCa());
  await assert.rejects(service.getMarque());
  await assert.rejects(service.validerCreation('creation-absente'));
  await assert.rejects(service.demanderRevision('creation-absente', 'nouveau montage'));
  supabase.auth.getSession = async () => ({ data: { session: { user: { id: 'marque' } } }, error: null });
  let tentativeInsertion = false;
  reponse = (req, init) => {
    if (String(req).includes('/profiles?')) return Response.json([{ client_id: 'marque' }]);
    tentativeInsertion = String(req).includes('/demandes?') && init.method === 'POST';
    return Response.json({ message: 'insertion refusée' }, { status: 403 });
  };
  await assert.rejects(service.envoyerDemande('Une demande à transmettre'));
  assert.equal(tentativeInsertion, true);
});

test('les jours de boutique manquants restent inconnus, les jours importés à zéro comptent', () => {
  const periode = { debut: '2026-11-01', fin: '2026-11-02' };
  const connexion = { statut: 'connecte', derniere_sync: '2026-11-03T00:00:00Z', en_echec: false };
  const mesures = [{ date: periode.debut, plateforme: 'meta', depense: 10, revenuAttribue: 9 }];
  const vide = service.bilan(mesures, [], periode);
  assert.equal(vide.mer, null);
  assert.equal(service.serieJournaliere(mesures, [], periode)[0].ca, null);
  assert.match(messageBoutique([], vide, periode), /attente de connexion/);
  assert.match(messageBoutique([{ ...connexion, derniere_sync: null }], vide, periode), /première synchronisation/);
  assert.match(messageBoutique([{ ...connexion, en_echec: true }], vide, periode), /échoué/);
  assert.match(messageBoutique([connexion], vide, periode), /Aucune donnée/);
  const jours = [periode.debut, periode.fin].map((date) => ({ date, ca: 0, commandes: 0, nouveauxClients: 0 }));
  const complet = service.bilan(mesures, jours, periode);
  assert.equal(complet.mer, 0);
  assert.equal(messageBoutique([connexion], complet, periode), 'Aucune vente sur la période.');
  assert.match(messageBoutique([connexion], service.bilan([], jours.slice(0, 1), periode), periode), /jours importés/);
  assert.equal(service.serieJournaliere([], jours, periode)[0].depense, null);
});

test('la période glissante par défaut finit aujourd’hui', () => {
  assert.equal(service.periodeGlissante(30).fin, new Date().toISOString().slice(0, 10));
  assert.deepEqual(service.periodeGlissante(7, new Date('2026-11-03T12:00:00Z')), { debut: '2026-10-28', fin: '2026-11-03' });
});
