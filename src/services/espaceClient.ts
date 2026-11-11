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

export { bilan, couvertureTexte, dans, decalerJour, jourUTC, moisValide, nombreJours, periodeDuMois, periodeGlissante, periodeMoisPrecedent, periodePrecedente, periodeRapport, PERIODE_VIDE, serieJournaliere, synthese, variation, variationsComparables } from './mesures';
export type { Bilan, PointJour } from './mesures';

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
