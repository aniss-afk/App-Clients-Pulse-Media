export const etapes = { TOFU: 'Découvrir', MOFU: 'Rassurer', BOFU: 'Convertir' } as const;
export const audiences = { froid: 'Froid', rtg: 'Reciblage' } as const;
export type Etape = keyof typeof etapes;
export type Audience = keyof typeof audiences;
export type Axe = 'angle' | 'persona';
export type Champ = Axe | 'sous_persona' | 'sous_angle';
export const champs: Record<Champ, string> = {
  angle: 'Angle',
  sous_angle: 'Sous-angle',
  persona: 'Persona',
  sous_persona: 'Sous-persona',
};

export interface Rendu {
  id: string;
  titre: string;
  format: string;
  apercu: string | null;
  fichiers: string[];
  etape: Etape | null;
  cible: Audience | null;
  angle: string | null;
  sous_angle: string | null;
  persona: string | null;
  sous_persona: string | null;
  changement: string | null;
  statut: string;
  partage: string | null;
  test_prevu_le: string | null;
  brief: string | null;
}
export interface Mesure {
  id: string;
  jour: string;
  audience: Audience | null;
  phase: string | null;
  attribution: string | null;
  depense: number | null;
  achats: number | null;
  valeur: number | null;
}
export interface Matrice {
  creations: Rendu[];
  mesures: Mesure[];
}
export interface Ligne {
  cle: string;
  nom: string;
  champ: Champ;
  rendus: Rendu[];
  enfants: Ligne[];
}
export function hierarchie(rendus: Rendu[], axe: Axe): Ligne[] {
  const ordre: Champ[] =
    axe === 'angle'
      ? ['angle', 'sous_angle', 'persona', 'sous_persona']
      : ['persona', 'sous_persona', 'angle', 'sous_angle'];
  function grouper(items: Rendu[], niveau: number, chemin: string[]): Ligne[] {
    if (niveau === ordre.length) return [];
    const champ = ordre[niveau];
    if (niveau > 0 && items.every((r) => !r[champ])) return grouper(items, niveau + 1, chemin);
    const groupes = new Map<string, Rendu[]>();
    for (const rendu of items) {
      const nom = rendu[champ] || 'À préciser';
      if (!groupes.has(nom)) groupes.set(nom, []);
      groupes.get(nom)!.push(rendu);
    }
    return [...groupes]
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([nom, rendus]) => {
        const path = [...chemin, champ, nom];
        return {
          nom,
          champ,
          cle: JSON.stringify(path),
          rendus,
          enfants: grouper(rendus, niveau + 1, path),
        };
      });
  }
  return grouper(rendus, 0, []);
}
export function total(mesures: Mesure[]) {
  function somme(champ: 'achats' | 'valeur' | 'depense') {
    if (!mesures.length || mesures.some((m) => m[champ] == null)) return null;
    return mesures.reduce((s, m) => s + m[champ]!, 0);
  }
  const achats = somme('achats'),
    depense = somme('depense'),
    valeur = somme('valeur');
  return { achats, depense, valeur, roas: depense && valeur != null ? valeur / depense : null };
}
export interface Bloc {
  rendus: Rendu[];
  mesures: Mesure[];
  pairs: Mesure[];
  titre: string;
  etape: Etape;
  audience: Audience;
}
export function construireBloc(ligne: Ligne, etape: Etape, audience: Audience, data: Matrice): Bloc {
  const eligibles = new Set(data.creations.filter((r) => r.etape === etape).map((r) => r.id));
  const candidats = data.mesures.filter((m) => eligibles.has(m.id) && m.audience === audience);
  const ids = new Set(ligne.rendus.map((r) => r.id));
  const mesures = candidats.filter((m) => ids.has(m.id));
  const diffuses = new Set(mesures.map((m) => m.id));
  const tousDiffuses = new Set(data.mesures.map((m) => m.id));
  const rendus = ligne.rendus.filter(
    (r) => diffuses.has(r.id) || (r.etape === etape && r.cible === audience && !tousDiffuses.has(r.id)),
  );
  return {
    titre: ligne.nom,
    etape,
    audience,
    rendus,
    mesures,
    pairs: candidats.filter((m) => !ids.has(m.id)),
  };
}
// Les ratios sont pondérés par la dépense. On ne compare que des jours et des conditions communs.
export function comparaison(bloc: Bloc) {
  const neutre = { ton: 'neutre', texte: 'Comparaison insuffisante', roas: null as number | null };
  if (!bloc.mesures.length || bloc.mesures.some((m) => !m.phase || !m.attribution)) return neutre;
  const cle = (m: Mesure) => JSON.stringify([m.phase, m.attribution, m.jour]);
  const cles = new Set(bloc.mesures.map(cle));
  const pairs = bloc.pairs.filter((m) => cles.has(cle(m)));
  const couvert = new Set(pairs.map(cle));
  if ([...cles].some((c) => !couvert.has(c)) || new Set(pairs.map((m) => m.id)).size < 2) return neutre;
  const contextes = new Set(bloc.mesures.map((m) => JSON.stringify([m.phase, m.attribution])));
  const ecarts: number[] = [];
  for (const contexte of contextes) {
    const meme = (m: Mesure) => JSON.stringify([m.phase, m.attribution]) === contexte;
    const temoin = pairs.filter(meme);
    if (new Set(temoin.map((m) => m.id)).size < 2) return neutre;
    const a = total(bloc.mesures.filter(meme)),
      b = total(temoin);
    if ((a.achats ?? 0) < 3 || (b.achats ?? 0) < 3 || a.roas == null || !b.roas) return neutre;
    ecarts.push(a.roas / b.roas - 1);
  }
  const a = total(bloc.mesures),
    b = total(pairs);
  if (a.roas == null || !b.roas) return neutre;
  if (ecarts.every((n) => n >= 0.2) && a.roas >= 1.2 * b.roas)
    return { ton: 'positif', texte: 'Au-dessus des pairs', roas: b.roas };
  if (ecarts.every((n) => n <= -0.2) && a.roas <= 0.8 * b.roas)
    return { ton: 'surveiller', texte: 'Sous les pairs', roas: b.roas };
  return { ...neutre, texte: 'Résultats proches ou contrastés', roas: b.roas };
}
export function etatRendu(r: Rendu, mesures: Mesure[], au: string) {
  if (r.statut === 'a_revoir') return 'En reprise';
  if (r.statut === 'refusee') return 'Refusé';
  if (r.statut === 'a_valider') return 'À valider';
  const dernier = mesures.reduce((jour, m) => (m.jour > jour ? m.jour : jour), '');
  const recentes = mesures.filter((m) => m.jour === dernier);
  if (recentes.length && recentes.every((m) => m.phase === 'test')) return 'En test';
  if (r.test_prevu_le && r.test_prevu_le > au) return 'Test à venir';
  if (recentes.length) return 'Diffusé sur la période';
  return 'Validé';
}

export function statutStudio(r: Rendu, data: Matrice, fin: string) {
  const faits = data.mesures.filter((m) => m.id === r.id);
  const base = etatRendu(r, faits, fin);
  if (
    base !== 'Diffusé sur la période' ||
    !r.etape ||
    !faits.length ||
    faits.some((m) => m.phase !== 'scaling' || !m.audience)
  )
    return base;
  const ligne: Ligne = { cle: r.id, nom: r.titre, champ: 'angle', rendus: [r], enfants: [] };
  const cibles = [...new Set(faits.map((m) => m.audience!))];
  return cibles.every((a) => comparaison(construireBloc(ligne, r.etape!, a, data)).ton === 'positif')
    ? 'Winner'
    : base;
}
