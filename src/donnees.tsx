import type { ConnexionBoutique } from './services/base';
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
  connexionsBoutique,
  getMetriques,
  periodeComplete,
} from './services/espaceClient';

/**
 * Un seul chargement pour tout l'espace.
 *
 * Les écrans se recoupent — les créations d'une campagne, la période
 * du graphique, le compteur du menu — et une requête par écran ferait
 * clignoter les mêmes chiffres à chaque navigation.
 */
interface Donnees {
  marque: Marque | null;
  boutiques: ConnexionBoutique[];
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
    marque: null,
    boutiques: [],
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
  const [periode, setPeriode] = useState<Periode>(() => periodeComplete(30));

  const [erreur, setErreur] = useState(false);
  const recharger = useCallback(async () => {
    try {
      const [marque, campagnes, creations, createurs, profils, etapes, metriques, ca, actions, demandes, documents, boutiques] =
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
          getDocuments(),
          connexionsBoutique(),
        ]);
      setEtat({ marque, campagnes, creations, createurs, profils, etapes, metriques, ca, actions, demandes, documents, boutiques, chargement: false });
      setErreur(false);
    } catch {
      setErreur(true);
    }
  }, []);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  const valeur = useMemo(
    () => ({ ...etat, periode, setPeriode, recharger }),
    [etat, periode, recharger],
  );

  if (erreur) return (
    <div role="alert" className="m-6 rounded-box border border-line bg-paper p-5">
      <p>Impossible de charger les données de votre marque.</p>
      <button type="button" onClick={() => void recharger()} className="mt-3 underline">Réessayer</button>
    </div>
  );

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useDonnees(): Donnees {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDonnees hors DonneesProvider');
  return ctx;
}
