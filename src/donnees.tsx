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
  CaJour,
  Campagne,
  Creation,
  Etape,
  Marque,
  MetriqueJour,
  Periode,
  getCa,
  getCampagnes,
  getCreations,
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
  marque: Marque | null;
  campagnes: Campagne[];
  creations: Creation[];
  etapes: Etape[];
  metriques: MetriqueJour[];
  ca: CaJour[];
  periode: Periode;
  setPeriode: (p: Periode) => void;
  chargement: boolean;
  recharger: () => Promise<void>;
}

const Ctx = createContext<Donnees | null>(null);

export function DonneesProvider({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<Omit<Donnees, 'periode' | 'setPeriode' | 'recharger'>>({
    marque: null,
    campagnes: [],
    creations: [],
    etapes: [],
    metriques: [],
    ca: [],
    chargement: true,
  });

  /* 30 jours par défaut : assez long pour lisser les week-ends, assez
     court pour que la tendance récente ne soit pas noyée. */
  const [periode, setPeriode] = useState<Periode>(() => periodeGlissante(30));

  const recharger = useCallback(async () => {
    const [marque, campagnes, creations, etapes, metriques, ca] = await Promise.all([
      getMarque(),
      getCampagnes(),
      getCreations(),
      getEtapes(),
      getMetriques(),
      getCa(),
    ]);
    setEtat({ marque, campagnes, creations, etapes, metriques, ca, chargement: false });
  }, []);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  const valeur = useMemo(
    () => ({ ...etat, periode, setPeriode, recharger }),
    [etat, periode, recharger],
  );

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useDonnees(): Donnees {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDonnees hors DonneesProvider');
  return ctx;
}
