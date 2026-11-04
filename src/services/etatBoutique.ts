import type { ConnexionBoutique } from './base';
import type { Bilan, Periode } from './espaceClient';

export function messageBoutique(connexions: ConnexionBoutique[], bilan: Bilan, periode: Periode): string | null {
  const jours = (Date.parse(periode.fin) - Date.parse(periode.debut)) / 86_400_000 + 1;
  const couverture = bilan.joursBoutique === 0
    ? 'Aucune donnée de vente importée sur cette période.'
    : bilan.joursBoutique < jours
      ? `Données de vente disponibles pour ${bilan.joursBoutique} jour(s) sur ${jours}.`
      : '';
  let connexion = '';
  if (connexions.some((c) => c.en_echec || c.statut === 'a_reconnecter')) {
    connexion = 'La dernière synchronisation a échoué. L’agence doit vérifier la connexion à la boutique.';
  } else if (!connexions.some((c) => c.statut === 'connecte')) {
    connexion = 'En attente de connexion à la boutique.';
  } else if (connexions.some((c) => c.statut === 'connecte' && !c.derniere_sync)) {
    connexion = 'Boutique connectée. La première synchronisation est en attente.';
  }
  const aucuneVente = bilan.joursBoutique > 0 && bilan.commandes === 0
    ? (bilan.joursBoutique === jours ? 'Aucune vente sur la période.' : 'Aucune vente sur les jours importés.')
    : '';
  return [connexion, couverture, aucuneVente].filter(Boolean).join(' ') || null;
}
