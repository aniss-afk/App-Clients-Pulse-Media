import assert from 'node:assert/strict';
import {
  comparaison,
  construireBloc,
  hierarchie,
  statutStudio,
  total,
  type Matrice,
  type Mesure,
  type Rendu,
} from '../src/matrice/modele';

function rendu(id: string, angle: string): Rendu {
  return {
    id,
    titre: id,
    angle,
    sous_angle: 'Preuve',
    persona: 'Collectionneur',
    sous_persona: 'Débutant',
    etape: 'TOFU',
    cible: 'froid',
    statut: 'validee',
    format: 'statique',
    changement: null,
    partage: null,
    fichiers: [],
    apercu: null,
    test_prevu_le: null,
    brief: null,
  };
}
const data: Matrice = {
  creations: [rendu('a', 'Collectionner'), rendu('b', 'Découvrir'), rendu('c', 'Découvrir')],
  mesures: [],
};
function fait(id: string, depense: number, valeur: number): Mesure {
  return {
    id,
    depense,
    valeur,
    achats: 4,
    audience: 'froid',
    phase: 'scaling',
    attribution: '7j',
    jour: '2026-11-20',
  };
}
data.mesures = [fait('a', 100, 600), fait('b', 20, 40), fait('c', 80, 240)];
const ligne = hierarchie(data.creations, 'angle').find((r) => r.nom === 'Collectionner')!;
const bloc = construireBloc(ligne, 'TOFU', 'froid', data);
assert.deepEqual(
  bloc.pairs.map((m) => m.id),
  ['b', 'c'],
);
assert.deepEqual(comparaison(bloc), { ton: 'positif', texte: 'Au-dessus des pairs', roas: 2.8 });
assert.equal(statutStudio(data.creations[0], data, '2026-11-20'), 'Winner');
assert.equal(comparaison({ ...bloc, pairs: [bloc.pairs[0], bloc.pairs[0]] }).ton, 'neutre');
assert.equal(
  comparaison({ ...bloc, pairs: bloc.pairs.map((m) => ({ ...m, jour: '2026-11-21' })) }).ton,
  'neutre',
);
assert.equal(
  comparaison({ ...bloc, mesures: bloc.mesures.map((m) => ({ ...m, attribution: null })) }).ton,
  'neutre',
);
assert.equal(total([{ ...fait('a', 30, 100), valeur: null }, fait('b', 20, 10)]).roas, null);
assert.equal(total([]).achats, null);
assert.equal(total([fait('b', 20, 0)]).roas, 0);
const persona = hierarchie(data.creations, 'persona')[0];
assert.equal(persona.enfants[0].champ, 'sous_persona');
assert.equal(persona.enfants[0].enfants[0].champ, 'angle');
assert.equal(construireBloc(ligne, 'TOFU', 'rtg', data).rendus.length, 0);
console.log('Matrice marque · regroupements, achats inconnus, pairs, fenêtres et verdicts vérifiés.');
