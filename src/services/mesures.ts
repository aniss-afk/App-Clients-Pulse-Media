import type { ActionAgence, CaJour, Etape, MetriqueJour, Periode } from './espaceClient';

const JOUR = 86_400_000;
export const PERIODE_VIDE: Periode = { debut: '', fin: '' };
export const jourUTC = (date = new Date()): string => date.toISOString().slice(0, 10);
export const moisValide = (mois: string): boolean => /^\d{4}-(0[1-9]|1[0-2])$/.test(mois);

function dateUTC(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && jourUTC(date) === iso ? date : null;
}

export function decalerJour(iso: string, jours: number): string {
  const date = dateUTC(iso);
  if (!date || !Number.isInteger(jours)) throw new Error('Date de calendrier invalide.');
  date.setUTCDate(date.getUTCDate() + jours);
  return jourUTC(date);
}

export function nombreJours(periode: Periode): number {
  const debut = dateUTC(periode.debut), fin = dateUTC(periode.fin);
  return debut && fin ? Math.max(0, (fin.getTime() - debut.getTime()) / JOUR + 1) : 0;
}

export function joursDePeriode(periode: Periode): string[] {
  const compte = nombreJours(periode);
  if (compte > 3660) throw new Error('Période trop longue.');
  return Array.from({ length: compte }, (_, i) => decalerJour(periode.debut, i));
}

/** N jours civils UTC terminés ; la journée en cours n'est jamais comparée. */
export function periodeGlissante(jours: number, maintenant = new Date()): Periode {
  if (!Number.isInteger(jours) || jours < 1 || jours > 3660) throw new Error('Durée invalide.');
  const fin = decalerJour(jourUTC(maintenant), -1);
  return { debut: decalerJour(fin, 1 - jours), fin };
}

export function periodePrecedente(periode: Periode): Periode {
  const compte = nombreJours(periode);
  if (!compte) return PERIODE_VIDE;
  const fin = decalerJour(periode.debut, -1);
  return { debut: decalerJour(fin, 1 - compte), fin };
}

export function periodeDuMois(mois: string): Periode {
  if (!moisValide(mois)) throw new Error('Mois invalide.');
  const debut = `${mois}-01`;
  const suivant = dateUTC(debut)!;
  suivant.setUTCMonth(suivant.getUTCMonth() + 1);
  return { debut, fin: decalerJour(jourUTC(suivant), -1) };
}

/** Le rapport du mois courant s'arrête à hier ; un mois futur est vide. */
export function periodeRapport(mois: string, maintenant = new Date()): Periode {
  const periode = periodeDuMois(mois);
  const hier = decalerJour(jourUTC(maintenant), -1);
  return { ...periode, fin: periode.fin < hier ? periode.fin : hier };
}

/** Mêmes numéros de jours, sans inventer le 29, 30 ou 31 d'un mois plus court. */
export function periodeMoisPrecedent(periode: Periode): Periode | null {
  if (!nombreJours(periode) || !periode.debut.endsWith('-01') || periode.debut.slice(0, 7) !== periode.fin.slice(0, 7)) return null;
  const precedent = periodeDuMois(decalerJour(periode.debut, -1).slice(0, 7));
  const fin = `${precedent.debut.slice(0, 7)}-${periode.fin.slice(8, 10)}`;
  return dateUTC(fin) ? { debut: precedent.debut, fin } : null;
}

export const dans = (date: string, periode: Periode): boolean => !!dateUTC(date) && date >= periode.debut && date <= periode.fin;
const fini = (valeur: unknown): valeur is number => typeof valeur === 'number' && Number.isFinite(valeur);

export interface Couverture {
  joursAttendus: number;
  joursCa: number;
  joursPub: number;
  caComplete: boolean;
  pubComplete: boolean;
  plateformes: string[];
}

export interface Bilan {
  depense: number;
  depenseParPlateforme: Record<string, number>;
  revenuAttribue: number;
  roasParPlateforme: Record<string, number | null>;
  ca: number;
  commandes: number;
  nouveauxClients: number | null;
  mer: number | null;
  cpa: number | null;
  couverture: Couverture;
}

/** Les totaux sont ceux reçus ; la couverture décide si une comparaison est possible. */
export function bilan(metriques: MetriqueJour[], ca: CaJour[], periode: Periode): Bilan {
  const recues = metriques.filter(x => dans(x.date, periode));
  const m = recues.filter(x => fini(x.depense) && x.depense >= 0);
  const caRecues = ca.filter(x => dans(x.date, periode));
  const c = caRecues.filter(x => fini(x.ca) && fini(x.commandes));
  const jours = joursDePeriode(periode);
  const plateformes = [...new Set(recues.map(x => x.plateforme))].sort();
  const clesPub = new Set(m.map(x => `${x.plateforme}:${x.date}`));
  const joursCa = new Set(c.map(x => x.date)).size;
  const joursPub = plateformes.length ? jours.filter(date => plateformes.every(p => clesPub.has(`${p}:${date}`))).length : 0;
  const couverture: Couverture = {
    joursAttendus: jours.length, joursCa, joursPub, plateformes,
    caComplete: jours.length > 0 && joursCa === jours.length && c.length === joursCa && caRecues.length === c.length,
    pubComplete: jours.length > 0 && joursPub === jours.length && m.length === clesPub.size && recues.length === m.length,
  };
  const depenseParPlateforme: Record<string, number> = {};
  const revenuParPlateforme: Record<string, number> = {};
  for (const x of m) {
    depenseParPlateforme[x.plateforme] = (depenseParPlateforme[x.plateforme] ?? 0) + x.depense;
    if (fini(x.revenuAttribue)) revenuParPlateforme[x.plateforme] = (revenuParPlateforme[x.plateforme] ?? 0) + x.revenuAttribue;
  }
  const depense = Object.values(depenseParPlateforme).reduce((s, n) => s + n, 0);
  const revenuAttribue = Object.values(revenuParPlateforme).reduce((s, n) => s + n, 0);
  const roasParPlateforme = Object.fromEntries(plateformes.map(p => [p,
    depenseParPlateforme[p] > 0 && m.filter(x => x.plateforme === p).every(x => fini(x.revenuAttribue))
      ? revenuParPlateforme[p] / depenseParPlateforme[p] : null,
  ]));
  const total = c.reduce((s, x) => s + x.ca, 0);
  const commandes = c.reduce((s, x) => s + x.commandes, 0);
  const nouveauxClients = couverture.caComplete && c.every(x => fini(x.nouveauxClients) && x.nouveauxClients >= 0)
    ? c.reduce((s, x) => s + x.nouveauxClients!, 0) : null;
  const complete = couverture.caComplete && couverture.pubComplete;
  return {
    depense, depenseParPlateforme, revenuAttribue, roasParPlateforme,
    ca: total, commandes, nouveauxClients, couverture,
    mer: complete && depense > 0 ? total / depense : null,
    cpa: complete && nouveauxClients !== null && nouveauxClients > 0 ? depense / nouveauxClients : null,
  };
}

export function variation(actuel: number, avant: number): number | null {
  return fini(actuel) && fini(avant) && avant > 0 ? (actuel - avant) / avant * 100 : null;
}

export function variationsComparables(actuel: Bilan, avant: Bilan | null) {
  const a = actuel.couverture, b = avant?.couverture;
  const memeDuree = !!b && a.joursAttendus > 0 && a.joursAttendus === b.joursAttendus;
  const ca = memeDuree && a.caComplete && b!.caComplete;
  const pub = memeDuree && a.pubComplete && b!.pubComplete && a.plateformes.join('|') === b!.plateformes.join('|');
  return {
    ca: ca ? variation(actuel.ca, avant!.ca) : null,
    depense: pub ? variation(actuel.depense, avant!.depense) : null,
    mer: ca && pub && actuel.mer !== null && avant!.mer !== null ? variation(actuel.mer, avant!.mer) : null,
  };
}

export function couvertureTexte(b: Bilan, source: 'ca' | 'pub'): string | undefined {
  const c = b.couverture, compte = source === 'ca' ? c.joursCa : c.joursPub;
  return (source === 'ca' ? c.caComplete : c.pubComplete) ? undefined
    : compte ? `${compte}/${c.joursAttendus} jours reçus` : 'Données non reçues';
}

export interface PointJour { date: string; depense: number | null; ca: number | null }

/** Les trous restent des trous, y compris lorsqu'un seul canal manque sur un jour. */
export function serieJournaliere(metriques: MetriqueJour[], ca: CaJour[], periode: Periode): PointJour[] {
  const m = metriques.filter(x => dans(x.date, periode));
  const c = ca.filter(x => dans(x.date, periode));
  if (!m.length && !c.length) return [];
  const plateformes = [...new Set(m.map(x => x.plateforme))];
  return joursDePeriode(periode).map(date => {
    const ventes = c.filter(x => x.date === date);
    const pubs = m.filter(x => x.date === date);
    const pubConnue = plateformes.length > 0 && pubs.length === plateformes.length && plateformes.every(p => pubs.filter(x => x.plateforme === p && fini(x.depense) && x.depense >= 0).length === 1);
    return { date,
      ca: ventes.length === 1 && fini(ventes[0].ca) ? ventes[0].ca : null,
      depense: pubConnue ? pubs.reduce((s, x) => s + x.depense, 0) : null,
    };
  });
}

/** Une comparaison impossible ne devient jamais une stabilité ou une baisse. */
export function synthese(actuel: Bilan, avant: Bilan | null, actions: ActionAgence[], etapes: Etape[], periode: Periode): string[] {
  const phrases: string[] = [];
  const deltas = variationsComparables(actuel, avant);
  const tendance = (v: number | null) => v === null ? '' : Math.abs(v) < 0.5 ? ' (stable)' : v > 0 ? ` (en hausse de ${Math.round(v)} %)` : ` (en baisse de ${Math.abs(Math.round(v))} %)`;
  if (actuel.mer !== null) phrases.push(`Sur la période, ${actuel.ca.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} de chiffre d'affaires${tendance(deltas.ca)} pour ${actuel.depense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} de publicité : chaque euro investi correspond à ${actuel.mer.toFixed(1).replace('.', ',')} € de chiffre d'affaires${tendance(deltas.mer)}.`);
  const recentes = actions.filter(a => dans(a.date, periode));
  if (recentes.length) {
    const premiere = recentes.find(a => a.resultat) ?? recentes[0];
    phrases.push(`${recentes.length} action${recentes.length > 1 ? 's' : ''} sur le compte, dont ${premiere.action}${premiere.resultat ? ` : ${premiere.resultat}` : ''}`);
  }
  const prochaine = etapes.filter(e => e.statut !== 'fait').sort((a, b) => a.date.localeCompare(b.date))[0];
  if (prochaine) phrases.push(`Prochaine étape : ${prochaine.titre}, le ${new Date(prochaine.date).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long' })}.`);
  return phrases;
}
