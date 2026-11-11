import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActionAgence,
  SuiviClient, RapportPublie, getSuivi, getRapports,
  CaJour,
  Campagne,
  Creation,
  Createur,
  Demande,
  Document,
  Etape,
  Marque,
  MetriqueJour,
  Periode,
  Profil,
  getActions,
  getCa,
  getCampagnes,
  getCreateurs,
  getCreations,
  getProfils,
  getDemandes,
  getDocuments,
  getEtapes,
  getMarque,
  getMetriques,
  periodeGlissante,
} from './services/espaceClient';

/**
 * Un seul chargement pour tout l'espace.
 *
 * Les écrans se recoupent — les créations d'une campagne, la période
 * du graphique, le compteur du menu — et une requête par écran ferait
 * clignoter les mêmes chiffres à chaque navigation.
 */
interface Donnees {
  suivi: SuiviClient[];
  rapports: RapportPublie[];
  marque: Marque | null;
  campagnes: Campagne[];
  creations: Creation[];
  createurs: Createur[];
  profils: Profil[];
  etapes: Etape[];
  metriques: MetriqueJour[];
  ca: CaJour[];
  actions: ActionAgence[];
  demandes: Demande[];
  documents: Document[];
  periode: Periode;
  setPeriode: (p: Periode) => void;
  chargement: boolean;
  recharger: () => Promise<void>;
}

const Ctx = createContext<Donnees | null>(null);

export function DonneesProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Omit<Donnees, 'periode' | 'setPeriode' | 'recharger'>>({
    suivi: [], rapports: [],
    marque: null,
    campagnes: [],
    creations: [],
    createurs: [],
    profils: [],
    etapes: [],
    metriques: [],
    ca: [],
    actions: [],
    demandes: [],
    documents: [],
    chargement: true,
  });

  /* 30 jours par défaut : assez long pour lisser les week-ends, assez
     court pour que la tendance récente ne soit pas noyée. */
  const [periode, setPeriode] = useState<Periode>(() => periodeGlissante(30));

  const [erreur,setErreur] = useState<string|null>(null);
  const recharger = useCallback(async () => {
    try {
    const [marque, campagnes, creations, createurs, profils, etapes, metriques, ca, actions, demandes, documents, suivi, rapports] =
      await Promise.all([
        getMarque(),
        getCampagnes(),
        getCreations(),
        getCreateurs(),
        getProfils(),
        getEtapes(),
        getMetriques(),
        getCa(),
        getActions(),
        getDemandes(),
        getDocuments(), getSuivi(), getRapports(),
      ]);
    setEtat({ marque, campagnes, creations, createurs, profils, etapes, metriques, ca, actions, demandes, documents, suivi, rapports, chargement: false });
    setErreur(null);
    } catch(e) { setErreur((e as Error).message); setEtat(v => ({...v,chargement:false})); throw e; }
  }, []);

  useEffect(() => {
    void recharger().catch(() => undefined);
  }, [recharger]);

  const valeur = useMemo(
    () => ({ ...etat, periode, setPeriode, recharger }),
    [etat, periode, recharger],
  );

  return <Ctx.Provider value={valeur}>

    {erreur && <p className="text-sm px-5 py-3 text-red-ink" role="alert">Données indisponibles : {erreur} <button type="button" onClick={() => void recharger().catch(() => undefined)}>Réessayer</button></p>}
    {(!erreur || etat.marque) && children}
  </Ctx.Provider>;
}

export function useDonnees(): Donnees {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDonnees hors DonneesProvider');
  return ctx;
}
