/**
 * Ce que la marque voit.
 *
 * La marque voit le travail, les prénoms et les comptes publics des
 * créateurs engagés. Le dossier privé et leurs commissions restent
 * réservés à l'agence et aux créateurs concernés. Cette frontière est
 * appliquée par les fonctions SQL, puis conservée dans les objets UI.
 *
 * Les lectures conservent les résultats vides et remontent les erreurs.
 * Aucun jeu de remplacement n’est embarqué dans l’application.
 */
import * as base from './base';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Marque {
  id: string;
  nom: string;
  contact: string;
  email: string;
  site: string;
  telephone: string;
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
  nouveauxClients: number | null;
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
  /** Le fichier déposé avant publication : c'est lui qu'on regarde pour valider. */
  fichier: string | null;
  /** Le lien du post, une fois en ligne. */
  lien: string | null;
  /* Qui l'a faite. La marque paie des créateurs : elle a le droit de
     savoir lesquels, et un post publié est public de toute façon. Ce
     qui s'arrête ici : le prénom et le compte, pas le dossier. */
  createur: string | null;
  compte: string | null;
  reseau: string | null;
}

/**
 * Un profil soumis à la marque, avant campagne.
 *
 * Tout ce qui aide à décider, et rien d'autre : la photo, la
 * présentation, les comptes publics et deux vidéos. Ni email, ni
 * téléphone, ni adresse. On choisit quelqu'un sur son travail.
 */
export interface Profil {
  participationId: string;
  campagneId: string;
  campagne: string;
  etape: 'chez_client' | 'retour_client';
  prenom: string;
  ville: string | null;
  bio: string | null;
  photo: string | null;
  univers: string[];
  abonnes: string | null;
  reseaux: { reseau: string; handle: string; url: string | null; abonnes: number | null; verifie: boolean }[];
  exemples: { url: string; reseau: string | null }[];
  /** Pourquoi l'agence l'a mis dans la liste. */
  argument: string | null;
  choix: 'retenu' | 'ecarte' | null;
  avis: string | null;
}

/** Un créateur qui travaille pour la marque, et ce qu'il a produit. */
export interface Createur {
  id: string;
  prenom: string;
  compte: string | null;
  reseau: string | null;
  abonnes: string | null;
  univers: string | null;
  campagnes: number;
  videosPubliees: number;
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

export type Canal = Plateforme | 'createurs' | 'boutique' | 'compte';

export const NOM_CANAL: Record<Canal, string> = {
  ...NOM_PLATEFORME,
  createurs: 'Créateurs',
  boutique: 'Boutique',
  compte: 'Compte',
};

/**
 * Une action de l'agence sur le compte, telle que la marque la lit.
 *
 * Trois champs et pas un de plus : ce qu'on a fait, pourquoi, et ce
 * que ça a donné quand c'est mesurable. Le résultat reste vide tant
 * qu'on ne l'a pas mesuré — écrire « en cours d'observation » vaut
 * mieux qu'un chiffre inventé.
 */
export interface ActionAgence {
  id: string;
  date: string;
  canal: Canal;
  action: string;
  raison: string;
  resultat: string | null;
}

export type StatutDemande = 'envoyee' | 'prise_en_compte' | 'traitee';

/** Ce que la marque nous demande, depuis son espace. */
export interface Demande {
  id: string;
  date: string;
  texte: string;
  statut: StatutDemande;
  reponse: string | null;
}

export type TypeDocument = 'facture' | 'contrat' | 'brief' | 'rapport';

export interface Document {
  id: string;
  nom: string;
  type: TypeDocument;
  date: string;
  /** Null tant qu'aucun fichier n'est attaché : on ne fabrique pas de lien. */
  url: string | null;
}

export const NOM_DOCUMENT: Record<TypeDocument, string> = {
  facture: 'Facture',
  contrat: 'Contrat',
  brief: 'Brief',
  rapport: 'Rapport',
};

const jourISO = (d: Date) => d.toISOString().slice(0, 10);

/** Une liste vide reste vide ; une erreur ne devient pas un résultat inventé. */
async function lire<T>(charger: () => Promise<T[] | null>): Promise<T[]> {
  const resultat = await charger();
  if (resultat === null) throw new Error('Données indisponibles. Réessayez.');
  return resultat;
}

/* ------------------------------------------------------------------ */
/* Lectures                                                            */
/* ------------------------------------------------------------------ */

export async function getMarque(): Promise<Marque> {
  const marque = await base.marque();
  if (!marque) throw new Error('Marque indisponible.');
  return marque;
}
export async function getCampagnes(): Promise<Campagne[]> {
  return lire(base.campagnes);
}
export async function getCreations(): Promise<Creation[]> {
  return lire(base.creations);
}
export async function getCreateurs(): Promise<Createur[]> {
  return lire(base.createurs);
}
export async function getProfils(): Promise<Profil[]> {
  return lire(base.profils);
}

/**
 * La marque tranche un profil.
 *
 * Elle peut revenir sur son choix tant qu'elle n'a pas bouclé : un
 * avis donné en trois secondes se regrette, et refuser quelqu'un est
 * une décision qui mérite un aller-retour.
 */
export async function trancherProfil(participationId: string, retenu: boolean, avis?: string): Promise<void> {
  await base.trancherProfil(participationId, retenu, avis ?? null);
}

/** La marque rend sa copie. Rien ne part aux créateurs : l'agence confirme derrière. */
export async function bouclerSelection(campagneId: string): Promise<void> {
  await base.bouclerSelection(campagneId);
}
export async function getEtapes(): Promise<Etape[]> {
  return lire(base.etapes);
}
export async function getMetriques(): Promise<MetriqueJour[]> {
  return lire(base.metriques);
}
export async function getCa(): Promise<CaJour[]> {
  return lire(base.ca);
}
export async function getActions(): Promise<ActionAgence[]> {
  return lire(base.actions);
}
export async function getDemandes(): Promise<Demande[]> {
  return lire(base.demandes);
}
export async function getDocuments(): Promise<Document[]> {
  return lire(base.documents);
}

/* ------------------------------------------------------------------ */
/* Écritures                                                           */
/* ------------------------------------------------------------------ */

/** Valider, c'est autoriser la diffusion. Rien d'autre ne se passe ici. */
export async function validerCreation(id: string): Promise<void> {
  await base.validerCreation(id);
}

/**
 * Demander une reprise.
 *
 * Le motif est obligatoire côté écran : une création renvoyée sans
 * raison revient à l'identique, et on a perdu trois jours.
 */
export async function demanderRevision(id: string, motif: string): Promise<void> {
  if (!motif.trim()) throw new Error('Précisez la retouche demandée.');
  await base.demanderRevision(id, motif);
}

/**
 * Envoyer une demande.
 *
 * Elle part telle quelle vers l'équipe, qui la retrouve dans son suivi
 * de la relation. Rien ne se perd sur une messagerie.
 */
export async function envoyerDemande(texte: string): Promise<Demande> {
  if (!texte.trim()) throw new Error('La demande est vide.');
  const envoyee = await base.envoyerDemande(texte);
  if (!envoyee) throw new Error('La demande n’a pas été enregistrée.');
  return envoyee;
}

/* ------------------------------------------------------------------ */
/* Synthèse                                                            */
/* ------------------------------------------------------------------ */

/**
 * La synthèse de la semaine, en trois phrases.
 *
 * Écrite à partir des chiffres et du journal, jamais à côté : si le
 * retour baisse, la première phrase le dit. Elle remplace le rapport
 * qu'on lirait en diagonale.
 */
export function synthese(
  actuel: Bilan,
  avant: Bilan,
  actions: ActionAgence[],
  etapes: Etape[],
  periode: Periode,
): string[] {
  const phrases: string[] = [];

  const varCa = variation(actuel.ca, avant.ca);
  const varMer = actuel.mer !== null && avant.mer !== null ? variation(actuel.mer, avant.mer) : null;
  const tendance = (v: number | null) =>
    v === null || Math.abs(v) < 0.5 ? 'stable' : v > 0 ? `en hausse de ${Math.round(v)} %` : `en baisse de ${Math.abs(Math.round(v))} %`;

  phrases.push(
    `Sur la période, ${actuel.ca.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} de chiffre d'affaires (${tendance(varCa)}) pour ${actuel.depense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} de publicité : chaque euro investi en a rapporté ${actuel.mer === null ? '—' : `${actuel.mer.toFixed(1).replace('.', ',')} €`}, un retour ${tendance(varMer)}.`,
  );

  const recentes = actions.filter((a) => dans(a.date, periode));
  if (recentes.length > 0) {
    const mesurees = recentes.filter((a) => a.resultat);
    const premiere = mesurees[0] ?? recentes[0];
    phrases.push(
      `${recentes.length} action${recentes.length > 1 ? 's' : ''} sur le compte, dont ${premiere.action.charAt(0).toLowerCase()}${premiere.action.slice(1)}${premiere.resultat ? ` : ${premiere.resultat.charAt(0).toLowerCase()}${premiere.resultat.slice(1)}` : ''}`,
    );
  }

  const prochaine = etapes
    .filter((e) => e.statut !== 'fait')
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  if (prochaine) {
    phrases.push(
      `Prochaine étape : ${prochaine.titre.charAt(0).toLowerCase()}${prochaine.titre.slice(1)}, le ${new Date(prochaine.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`,
    );
  }

  return phrases;
}

/* ------------------------------------------------------------------ */
/* Périodes et calculs                                                 */
/* ------------------------------------------------------------------ */

export function periodeGlissante(jours: number, fin = new Date()): Periode {
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
  nouveauxClients: number | null;
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
  const nouveauxClients = c.length && c.every(x => x.nouveauxClients !== null)
    ? c.reduce((s, x) => s + (x.nouveauxClients ?? 0), 0) : null;

  return {
    depense,
    depenseParPlateforme,
    revenuAttribue,
    roasParPlateforme,
    ca: total,
    commandes,
    nouveauxClients,
    mer: depense > 0 ? total / depense : null,
    cpa: nouveauxClients !== null && nouveauxClients > 0 ? depense / nouveauxClients : null,
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


/* ------------------------------------------------------------------ */
/* La fiche de la marque, tenue par la marque                          */
/* ------------------------------------------------------------------ */

/**
 * Corriger ses propres informations.
 *
 * Ce que l'agence a saisi en ouvrant le compte n'est pas gravé : un
 * site change, un contact part. Ce qui relève de la relation
 * commerciale, en revanche, ne bouge pas d'ici : le statut, le budget
 * et la date d'entrée sont remis à leur valeur par la base, quoi qu'on
 * envoie.
 */
export async function enregistrerMarque(saisie: {
  nom: string;
  contact: string;
  site: string;
  telephone: string;
  secteur: string;
}): Promise<void> {
  const { supabase } = await import('../auth/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non connecté');

  const { data: profil } = await supabase
    .from('profiles').select('client_id').eq('id', session.user.id).maybeSingle();
  if (!profil?.client_id) throw new Error('Aucune marque rattachée à ce compte.');

  const { data, error } = await supabase
    .from('clients')
    .update({
      nom: saisie.nom.trim(),
      contact: saisie.contact.trim() || null,
      site: saisie.site.trim() || null,
      telephone: saisie.telephone.trim() || null,
      secteur: saisie.secteur.trim() || null,
    })
    .eq('id', profil.client_id).select('id').single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Les informations de la marque n’ont pas été enregistrées.');
}

export interface SuiviClient { id: string; type: 'action'|'relance'; titre: string; detail: string|null; echeance: string|null; statut: string; genre: string; reponse: string|null }
export interface RapportPublie { id: string; periode: 'hebdo'|'mensuel'; debut: string; fin: string; contenu: string|null; drive_url: string|null; cree_le: string }
export const getSuivi = () => lire<SuiviClient>(base.suivi);
export const getRapports = () => lire<RapportPublie>(base.rapports);
export async function repondreSuivi(type: SuiviClient['type'], id: string, decision: 'valider'|'refuser'|'terminer', message?: string) {
  if (decision === 'refuser' && !message?.trim()) throw new Error('Précisez votre retour.');
  return base.repondreSuivi(type, id, decision, message);
}
