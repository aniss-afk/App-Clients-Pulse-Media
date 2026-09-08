import { supabase } from '../auth/supabase';
import type {
  ActionAgence,
  CaJour,
  Campagne,
  Canal,
  Creation,
  Createur,
  Profil,
  Demande,
  Document,
  Etape,
  Marque,
  MetriqueJour,
  Plateforme,
  StatutCampagne,
  StatutCreation,
  StatutDemande,
  StatutEtape,
  TypeDocument,
} from './espaceClient';

/**
 * Les lectures réelles de l'espace marque.
 *
 * Un seul projet Supabase pour les trois espaces, les mêmes tables, et
 * la même frontière : ce qu'une marque peut lire est décidé par
 * `mon_client_id()` dans les politiques de la base. Rien ici ne filtre
 * par `client_id` — ce serait un filtre de confort qu'on croirait être
 * une protection.
 *
 * Deux exceptions passent par des vues et des fonctions plutôt que par
 * les tables : `contenus_marque`, qui retire l'identité du créateur de
 * chaque contenu, et `campagnes_marque()`, qui compte les créateurs
 * engagés sans jamais les nommer.
 */

/**
 * Vrai quand on lit la base plutôt que la démonstration.
 *
 * L'espace ne s'ouvre plus sans session ni sans rattachement à une
 * marque : à partir de là, montrer les chiffres d'une autre marque
 * serait pire que de ne rien montrer. Le réel est donc la règle, et
 * `VITE_DONNEES_REELLES=false` la seule façon de repasser en
 * démonstration — pour une capture d'écran ou une présentation.
 */
export async function branchee(): Promise<boolean> {
  if (import.meta.env.VITE_DONNEES_REELLES === 'false') return false;
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session);
}

const jour = (v: string | null) => (v ?? '').slice(0, 10);
const num = (v: unknown) => Number(v ?? 0);

/* Vignette de remplacement tant qu'il n'y a pas de fichier. Tirée de
   l'identifiant plutôt que du hasard : la même création garde la même
   teinte d'un chargement à l'autre. */
const TEINTES = ['#E7E1D5', '#F4F0E6', '#FFE9E6'];
const teinte = (id: string) =>
  TEINTES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % TEINTES.length];

export async function marque(): Promise<Marque | null> {
  const { data } = await supabase
    .from('clients')
    .select('id, nom, contact, email, site, telephone, secteur, depuis')
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    nom: data.nom ?? '',
    contact: data.contact ?? '',
    email: data.email ?? '',
    site: data.site ?? '',
    telephone: data.telephone ?? '',
    secteur: data.secteur ?? '',
    depuis: jour(data.depuis),
  };
}

export async function campagnes(): Promise<Campagne[] | null> {
  const { data, error } = await supabase.rpc('campagnes_marque');
  if (error || !data) return null;
  return (data as Record<string, unknown>[]).map((c) => ({
    id: String(c.id),
    produit: String(c.produit ?? ''),
    prixTtc: c.prix_ttc === null ? null : num(c.prix_ttc),
    debut: jour(c.debut as string),
    fin: jour(c.fin as string),
    statut: (c.statut as StatutCampagne) ?? 'active',
    videosAttendues: num(c.videos_attendues),
    videosLivrees: num(c.videos_livrees),
    createursEngages: num(c.createurs_engages),
  }));
}

export async function creations(): Promise<Creation[] | null> {
  /* Une fonction et non la vue `contenus_marque` : le prénom et le
     compte du créateur vivent dans `creators`, sur laquelle la marque
     n'a aucune politique de lecture. Une vue en `security_invoker` y
     perdrait les lignes ; la fonction porte le filtre par marque. */
  const { data, error } = await supabase.rpc('creations_marque');
  if (error || !data) return null;
  return (data as Record<string, any>[]).map((c) => ({
    id: c.id,
    campagneId: c.campaign_id,
    titre: c.titre ?? '',
    angle: c.angle ?? '',
    teinte: teinte(c.id),
    /* La durée n'est pas en base : elle vit dans le fichier vidéo. Un
       tiret plutôt qu'un nombre inventé. */
    duree: '—',
    deposeLe: jour(c.cree_le),
    /* Une création publiée n'attend plus rien de la marque : son état
       vient de la date de publication, pas d'un second champ à tenir
       à jour. */
    statut: (c.date_publication
      ? 'en_ligne'
      : (c.statut_marque as StatutCreation) ?? 'a_valider') as StatutCreation,
    motif: c.motif_marque,
    publieeLe: c.date_publication ? jour(c.date_publication) : null,
    vues: num(c.vues),
    ventes: num(c.ventes),
    fichier: c.fichier ?? null,
    lien: c.url_publication ?? null,
    createur: c.createur_prenom ?? null,
    compte: c.createur_handle ?? null,
    reseau: c.createur_reseau ?? null,
  }));
}

export async function createurs(): Promise<Createur[] | null> {
  const { data, error } = await supabase.rpc('createurs_marque');
  if (error || !data) return null;
  return (data as Record<string, any>[]).map((c) => ({
    id: String(c.creator_id),
    prenom: String(c.prenom ?? ''),
    compte: c.handle ?? null,
    reseau: c.reseau ?? null,
    abonnes: c.abonnes_tranche ?? null,
    univers: c.univers ?? null,
    campagnes: num(c.campagnes),
    videosPubliees: num(c.videos_publiees),
    vues: num(c.vues),
    ventes: num(c.ventes),
  }));
}

export async function etapes(): Promise<Etape[] | null> {
  const { data, error } = await supabase
    .from('etapes_roadmap')
    .select('id, campaign_id, date, titre, detail, statut')
    .order('date');
  if (error || !data) return null;
  return data.map((e) => ({
    id: e.id,
    campagneId: e.campaign_id,
    date: jour(e.date),
    titre: e.titre ?? '',
    detail: e.detail ?? '',
    statut: (e.statut as StatutEtape) ?? 'a_venir',
  }));
}

export async function metriques(): Promise<MetriqueJour[] | null> {
  const { data, error } = await supabase
    .from('metriques_jour')
    .select('plateforme, date, depense, impressions, clics, conversions, revenu_attribue')
    .order('date');
  if (error || !data) return null;
  return data.map((m) => ({
    plateforme: (m.plateforme as Plateforme) ?? 'meta',
    date: jour(m.date),
    depense: num(m.depense),
    impressions: num(m.impressions),
    clics: num(m.clics),
    conversions: num(m.conversions),
    revenuAttribue: num(m.revenu_attribue),
  }));
}

export async function ca(): Promise<CaJour[] | null> {
  const { data, error } = await supabase
    .from('ca_jour')
    .select('date, ca, commandes, nouveaux_clients')
    .order('date');
  if (error || !data) return null;
  return data.map((c) => ({
    date: jour(c.date),
    ca: num(c.ca),
    commandes: num(c.commandes),
    nouveauxClients: num(c.nouveaux_clients),
  }));
}

export async function actions(): Promise<ActionAgence[] | null> {
  const { data, error } = await supabase
    .from('actions_agence')
    .select('id, date, canal, action, raison, resultat')
    .order('date', { ascending: false });
  if (error || !data) return null;
  return data.map((a) => ({
    id: a.id,
    date: jour(a.date),
    canal: (a.canal as Canal) ?? 'compte',
    action: a.action ?? '',
    raison: a.raison ?? '',
    resultat: a.resultat,
  }));
}

export async function demandes(): Promise<Demande[] | null> {
  const { data, error } = await supabase
    .from('demandes')
    .select('id, texte, statut, reponse, cree_le')
    .order('cree_le', { ascending: false });
  if (error || !data) return null;
  return data.map((d) => ({
    id: d.id,
    date: jour(d.cree_le),
    texte: d.texte ?? '',
    statut: (d.statut as StatutDemande) ?? 'envoyee',
    reponse: d.reponse,
  }));
}

export async function documents(): Promise<Document[] | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, nom, type, date, fichier')
    .order('date', { ascending: false });
  if (error || !data) return null;
  return data.map((d) => ({
    id: d.id,
    nom: d.nom ?? '',
    type: (d.type as TypeDocument) ?? 'rapport',
    date: jour(d.date),
    url: d.fichier,
  }));
}

/* ---------------- Écritures ---------------- */

/** Valider, c'est autoriser la diffusion. Rien d'autre ne se passe ici. */
export async function validerCreation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('creator_contents')
    .update({ statut_marque: 'validee', motif_marque: null })
    .eq('id', id);
  return !error;
}

export async function demanderRevision(id: string, motif: string): Promise<boolean> {
  const { error } = await supabase
    .from('creator_contents')
    .update({ statut_marque: 'a_revoir', motif_marque: motif })
    .eq('id', id);
  return !error;
}

export async function envoyerDemande(texte: string): Promise<Demande | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data: profil } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', session.user.id)
    .maybeSingle();
  if (!profil?.client_id) return null;

  const { data, error } = await supabase
    .from('demandes')
    .insert({ client_id: profil.client_id, texte, statut: 'envoyee' })
    .select('id, texte, statut, reponse, cree_le')
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    date: jour(data.cree_le),
    texte: data.texte ?? '',
    statut: (data.statut as StatutDemande) ?? 'envoyee',
    reponse: data.reponse,
  };
}

/* ------------------------------------------------------------------ */
/* La sélection des créateurs                                          */
/* ------------------------------------------------------------------ */

export async function profils(): Promise<Profil[] | null> {
  const { data, error } = await supabase.rpc('selection_marque');
  if (error || !data) return null;
  return (data as Record<string, any>[]).map((r) => ({
    participationId: String(r.participation_id),
    campagneId: String(r.campaign_id),
    campagne: String(r.campagne ?? ''),
    etape: (r.etape_selection === 'retour_client' ? 'retour_client' : 'chez_client') as Profil['etape'],
    prenom: String(r.prenom ?? ''),
    ville: r.ville ?? null,
    bio: r.bio ?? null,
    photo: r.photo ?? null,
    univers: (r.univers ?? []) as string[],
    abonnes: r.abonnes_tranche ?? null,
    reseaux: (r.reseaux ?? []) as Profil['reseaux'],
    exemples: (r.exemples ?? []) as Profil['exemples'],
    argument: r.argument ?? null,
    choix: (r.selection === 'retenu' || r.selection === 'ecarte' ? r.selection : null) as Profil['choix'],
    avis: r.avis_client ?? null,
  }));
}

export async function trancherProfil(participationId: string, retenu: boolean, avis: string | null): Promise<void> {
  const { error } = await supabase.rpc('trancher_profil', {
    p_participation: participationId,
    p_retenu: retenu,
    p_avis: avis,
  });
  if (error) throw new Error(error.message);
}

export async function bouclerSelection(campagneId: string): Promise<void> {
  const { error } = await supabase.rpc('boucler_selection', { p_campagne: campagneId });
  if (error) throw new Error(error.message);
}
