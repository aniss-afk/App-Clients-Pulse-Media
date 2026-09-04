/**
 * Ce que la marque voit.
 *
 * Une frontière traverse ce fichier et c'est la seule chose à en
 * retenir : aucun objet servi ici ne porte l'identité d'un créateur —
 * ni son nom, ni son compte, ni son audience, ni ce qu'il touche. La
 * marque voit ses campagnes, les créations produites pour elle, ses
 * dépenses et ses résultats. La frontière est tenue par le service,
 * pas par l'interface : une colonne ajoutée par erreur dans un écran
 * ne peut pas révéler ce qui n'est pas dans les données.
 *
 * Tout est simulé pour l'instant. Les fonctions sont asynchrones
 * exprès : le jour où la base répond à leur place, aucun écran ne
 * change.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Marque {
  id: string;
  nom: string;
  contact: string;
  secteur: string;
  depuis: string;
}

export type Plateforme = 'meta' | 'google' | 'tiktok';

export const NOM_PLATEFORME: Record<Plateforme, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
};

export interface MetriqueJour {
  plateforme: Plateforme;
  date: string;
  depense: number;
  impressions: number;
  clics: number;
  conversions: number;
  /** Le revenu que la plateforme s'attribue. Il se compare, il ne s'additionne pas. */
  revenuAttribue: number;
}

/** Le chiffre d'affaires réel, tel que la boutique le déclare. */
export interface CaJour {
  date: string;
  ca: number;
  commandes: number;
  nouveauxClients: number;
}

export type StatutCampagne = 'a_venir' | 'active' | 'terminee';

export interface Campagne {
  id: string;
  produit: string;
  prixTtc: number | null;
  debut: string;
  fin: string;
  statut: StatutCampagne;
  videosAttendues: number;
  videosLivrees: number;
  /** Un nombre, pas une liste : la marque connaît le volume, pas les personnes. */
  createursEngages: number;
}

export type StatutCreation = 'a_valider' | 'validee' | 'a_revoir' | 'en_ligne';

export interface Creation {
  id: string;
  campagneId: string;
  titre: string;
  angle: string;
  /** Une vignette de couleur tient lieu d'aperçu tant qu'il n'y a pas de fichier. */
  teinte: string;
  duree: string;
  deposeLe: string;
  statut: StatutCreation;
  /** Ce que la marque a demandé de reprendre. */
  motif: string | null;
  publieeLe: string | null;
  vues: number;
  ventes: number;
}

export type StatutEtape = 'fait' | 'en_cours' | 'a_venir';

export interface Etape {
  id: string;
  campagneId: string | null;
  date: string;
  titre: string;
  detail: string;
  statut: StatutEtape;
}

export interface Periode {
  debut: string;
  fin: string;
}

/* ------------------------------------------------------------------ */
/* Jeu de démonstration                                                */
/* ------------------------------------------------------------------ */

/* Générateur déterministe : le même jeu à chaque chargement, pour que
   deux captures d'écran se comparent. */
function alea(graine: number) {
  let x = graine;
  return () => {
    x = (x * 1_103_515_245 + 12_345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

const AUJOURDHUI = new Date('2026-09-04');

const jourISO = (d: Date) => d.toISOString().slice(0, 10);

const j = (decalage: number) => {
  const d = new Date(AUJOURDHUI);
  d.setDate(d.getDate() + decalage);
  return jourISO(d);
};

function genererMetriques() {
  const r = alea(20260904);
  const metriques: MetriqueJour[] = [];
  const ca: CaJour[] = [];

  for (let i = 119; i >= 0; i -= 1) {
    const date = j(-i);
    const jourSemaine = new Date(date).getDay();
    /* Le week-end pèse moins : sans cette pente, la courbe est plate et
       ne ressemble à aucun compte réel. */
    const poids = jourSemaine === 0 || jourSemaine === 6 ? 0.78 : 1;
    /* Montée douce sur la période, plus le bruit du jour. */
    const tendance = 1 + (119 - i) / 260;

    let depenseJour = 0;
    for (const plateforme of ['meta', 'google', 'tiktok'] as Plateforme[]) {
      const base = plateforme === 'meta' ? 640 : plateforme === 'google' ? 230 : 115;
      const depense = Math.round(base * poids * tendance * (0.82 + r() * 0.4));
      const clics = Math.round(depense * (1.5 + r() * 0.7));
      const conversions = Math.round(clics * (0.026 + r() * 0.02));
      metriques.push({
        plateforme,
        date,
        depense,
        impressions: Math.round(clics * (42 + r() * 28)),
        clics,
        conversions,
        revenuAttribue: Math.round(conversions * (62 + r() * 44)),
      });
      depenseJour += depense;
    }

    const commandes = Math.round((depenseJour / 21) * (0.85 + r() * 0.35));
    ca.push({
      date,
      ca: Math.round(commandes * (56 + r() * 22)),
      commandes,
      nouveauxClients: Math.round(commandes * (0.6 + r() * 0.16)),
    });
  }
  return { metriques, ca };
}

const genere = genererMetriques();

const demo = {
  marque: {
    id: 'cl1',
    nom: 'Layane',
    contact: 'Sarah Benali',
    secteur: 'Beauté',
    depuis: '2026-05-02',
  } as Marque,

  campagnes: [
    { id: 'cp1', produit: 'Sérum Éclat', prixTtc: 59, debut: j(-17), fin: j(24), statut: 'active', videosAttendues: 10, videosLivrees: 4, createursEngages: 2 },
    { id: 'cp2', produit: 'Crème de nuit', prixTtc: 42, debut: j(21), fin: j(62), statut: 'a_venir', videosAttendues: 8, videosLivrees: 0, createursEngages: 2 },
    { id: 'cp0', produit: 'Coffret découverte', prixTtc: 79, debut: j(-96), fin: j(-40), statut: 'terminee', videosAttendues: 6, videosLivrees: 6, createursEngages: 3 },
  ] as Campagne[],

  creations: [
    { id: 'cr1', campagneId: 'cp1', titre: 'Le test des 7 jours', angle: 'La preuve en 7 jours', teinte: '#E7E1D5', duree: '0:34', deposeLe: j(-13), statut: 'en_ligne', motif: null, publieeLe: j(-11), vues: 412000, ventes: 31 },
    { id: 'cr2', campagneId: 'cp1', titre: 'Ce que personne ne te dit', angle: 'La preuve en 7 jours', teinte: '#F4F0E6', duree: '0:41', deposeLe: j(-9), statut: 'en_ligne', motif: null, publieeLe: j(-6), vues: 88000, ventes: 9 },
    { id: 'cr3', campagneId: 'cp1', titre: 'Avant / après un mois', angle: 'Le prix contre une séance en institut', teinte: '#FFE9E6', duree: '0:38', deposeLe: j(-2), statut: 'a_valider', motif: null, publieeLe: null, vues: 0, ventes: 0 },
    { id: 'cr4', campagneId: 'cp1', titre: 'Ma routine du soir', angle: 'La routine du soir', teinte: '#E7E1D5', duree: '0:52', deposeLe: j(-1), statut: 'a_valider', motif: null, publieeLe: null, vues: 0, ventes: 0 },
    { id: 'cr5', campagneId: 'cp0', titre: 'Trois produits, un rituel', angle: 'Le coffret comme cadeau', teinte: '#F4F0E6', duree: '0:29', deposeLe: j(-72), statut: 'en_ligne', motif: null, publieeLe: j(-70), vues: 156000, ventes: 22 },
    { id: 'cr6', campagneId: 'cp0', titre: 'Le déballage', angle: 'Le coffret comme cadeau', teinte: '#E7E1D5', duree: '0:47', deposeLe: j(-80), statut: 'a_revoir', motif: 'Le prix affiché à l\'écran n\'était plus le bon.', publieeLe: null, vues: 0, ventes: 0 },
  ] as Creation[],

  etapes: [
    { id: 'et1', campagneId: 'cp1', date: j(-24), titre: 'Brief validé', detail: 'Trois angles retenus : la preuve en 7 jours, le prix contre l\'institut, la routine du soir.', statut: 'fait' },
    { id: 'et2', campagneId: 'cp1', date: j(-19), titre: 'Produits expédiés', detail: 'Deux créateurs servis, réception confirmée sous 48 h.', statut: 'fait' },
    { id: 'et3', campagneId: 'cp1', date: j(-13), titre: 'Premières vidéos livrées', detail: 'Deux créations mises en ligne et poussées en publicité.', statut: 'fait' },
    { id: 'et4', campagneId: 'cp1', date: j(-2), titre: 'Deuxième salve à valider', detail: 'Deux créations attendent votre retour avant diffusion.', statut: 'en_cours' },
    { id: 'et5', campagneId: 'cp1', date: j(11), titre: 'Montée en budget', detail: 'Bascule du budget sur les deux créations qui tiennent le meilleur coût par vente.', statut: 'a_venir' },
    { id: 'et6', campagneId: 'cp1', date: j(24), titre: 'Bilan de vague', detail: 'Rapport écrit, ce qui a marché, ce qu\'on garde pour la suivante.', statut: 'a_venir' },
    { id: 'et7', campagneId: 'cp2', date: j(14), titre: 'Brief crème de nuit', detail: 'Angles proposés à votre validation une semaine avant le lancement.', statut: 'a_venir' },
    { id: 'et8', campagneId: 'cp2', date: j(21), titre: 'Lancement crème de nuit', detail: 'Deux créateurs, huit vidéos attendues sur six semaines.', statut: 'a_venir' },
  ] as Etape[],
};

const copie = <T,>(t: T[]): T[] => t.map((x) => ({ ...x }));

/* ------------------------------------------------------------------ */
/* Lectures                                                            */
/* ------------------------------------------------------------------ */

export async function getMarque(): Promise<Marque> {
  return { ...demo.marque };
}
export async function getCampagnes(): Promise<Campagne[]> {
  return copie(demo.campagnes);
}
export async function getCreations(): Promise<Creation[]> {
  return copie(demo.creations);
}
export async function getEtapes(): Promise<Etape[]> {
  return copie(demo.etapes);
}
export async function getMetriques(): Promise<MetriqueJour[]> {
  return copie(genere.metriques);
}
export async function getCa(): Promise<CaJour[]> {
  return copie(genere.ca);
}

/* ------------------------------------------------------------------ */
/* Écritures                                                           */
/* ------------------------------------------------------------------ */

/** Valider, c'est autoriser la diffusion. Rien d'autre ne se passe ici. */
export async function validerCreation(id: string): Promise<void> {
  const c = demo.creations.find((x) => x.id === id);
  if (!c) return;
  c.statut = 'validee';
  c.motif = null;
}

/**
 * Demander une reprise.
 *
 * Le motif est obligatoire côté écran : une création renvoyée sans
 * raison revient à l'identique, et on a perdu trois jours.
 */
export async function demanderRevision(id: string, motif: string): Promise<void> {
  const c = demo.creations.find((x) => x.id === id);
  if (!c) return;
  c.statut = 'a_revoir';
  c.motif = motif;
}

/* ------------------------------------------------------------------ */
/* Périodes et calculs                                                 */
/* ------------------------------------------------------------------ */

export function periodeGlissante(jours: number, fin = AUJOURDHUI): Periode {
  const debut = new Date(fin);
  debut.setDate(debut.getDate() - (jours - 1));
  return { debut: jourISO(debut), fin: jourISO(fin) };
}

export function periodePrecedente(p: Periode): Periode {
  const debut = new Date(p.debut);
  const fin = new Date(p.fin);
  const longueur = Math.round((fin.getTime() - debut.getTime()) / 86_400_000) + 1;
  const finAvant = new Date(debut);
  finAvant.setDate(finAvant.getDate() - 1);
  const debutAvant = new Date(finAvant);
  debutAvant.setDate(debutAvant.getDate() - (longueur - 1));
  return { debut: jourISO(debutAvant), fin: jourISO(finAvant) };
}

export function periodeDuMois(mois: string): Periode {
  const [a, m] = mois.split('-').map(Number);
  const dernier = new Date(a, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { debut: `${a}-${pad(m)}-01`, fin: `${a}-${pad(m)}-${pad(dernier)}` };
}

const dans = (date: string, p: Periode) => date >= p.debut && date <= p.fin;

export interface Bilan {
  depense: number;
  depenseParPlateforme: Record<string, number>;
  revenuAttribue: number;
  roasParPlateforme: Record<string, number | null>;
  ca: number;
  commandes: number;
  nouveauxClients: number;
  /** CA réel ÷ dépense totale. Le seul chiffre qui explique le compte en banque. */
  mer: number | null;
  cpa: number | null;
}

export function bilan(metriques: MetriqueJour[], ca: CaJour[], periode: Periode): Bilan {
  const m = metriques.filter((x) => dans(x.date, periode));
  const c = ca.filter((x) => dans(x.date, periode));

  const depenseParPlateforme: Record<string, number> = {};
  const revenuParPlateforme: Record<string, number> = {};
  let depense = 0;
  let revenuAttribue = 0;

  for (const x of m) {
    depenseParPlateforme[x.plateforme] = (depenseParPlateforme[x.plateforme] ?? 0) + x.depense;
    revenuParPlateforme[x.plateforme] = (revenuParPlateforme[x.plateforme] ?? 0) + x.revenuAttribue;
    depense += x.depense;
    revenuAttribue += x.revenuAttribue;
  }

  const roasParPlateforme: Record<string, number | null> = {};
  for (const p of Object.keys(depenseParPlateforme)) {
    roasParPlateforme[p] = depenseParPlateforme[p] > 0 ? revenuParPlateforme[p] / depenseParPlateforme[p] : null;
  }

  const total = c.reduce((s, x) => s + x.ca, 0);
  const commandes = c.reduce((s, x) => s + x.commandes, 0);
  const nouveauxClients = c.reduce((s, x) => s + x.nouveauxClients, 0);

  return {
    depense,
    depenseParPlateforme,
    revenuAttribue,
    roasParPlateforme,
    ca: total,
    commandes,
    nouveauxClients,
    mer: depense > 0 ? total / depense : null,
    cpa: nouveauxClients > 0 ? depense / nouveauxClients : null,
  };
}

/** Série dépense / CA alignée jour par jour, pour le graphique. */
export function serieJournaliere(metriques: MetriqueJour[], ca: CaJour[], periode: Periode) {
  const parJour = new Map<string, { date: string; depense: number; ca: number }>();
  for (const x of ca.filter((y) => dans(y.date, periode))) {
    parJour.set(x.date, { date: x.date, depense: 0, ca: x.ca });
  }
  for (const x of metriques.filter((y) => dans(y.date, periode))) {
    const l = parJour.get(x.date) ?? { date: x.date, depense: 0, ca: 0 };
    l.depense += x.depense;
    parJour.set(x.date, l);
  }
  return [...parJour.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Écart en pourcentage. Null quand la référence est nulle. */
export function variation(actuel: number, avant: number): number | null {
  if (avant === 0) return null;
  return ((actuel - avant) / avant) * 100;
}
