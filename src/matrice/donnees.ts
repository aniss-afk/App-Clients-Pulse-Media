import { useEffect, useState } from 'react';
import { supabase } from '../auth/supabase';
import { useMoi } from '../auth/Porte';
import type { Matrice, Rendu } from './modele';

export interface Brief {
  campaign_id: string;
  produit: string;
  statut_client: string;
  envoye_client_le: string;
  angles: { titre: string; pourquoi?: string }[];
  hooks: { texte: string }[];
  structure: { etape: string; duree?: string; conseil?: string }[];
  interdits: { quoi: string; pourquoi?: string }[];
}
export type Lecture = Matrice & {
  briefs: Brief[];
  lectureSeule?: boolean;
  images: Record<string, string>;
};
export function useStudio(debut: string, fin: string) {
  const moi = useMoi();
  const cle = JSON.stringify([moi?.id, moi?.clientId, debut, fin]);
  const [version, relire] = useState(0);
  const [etat, setEtat] = useState<{ cle: string; data?: Lecture; erreur?: string }>();
  useEffect(() => {
    let actif = true;
    async function lire() {
      const [matrix, briefs] = await Promise.all([
        supabase.rpc('portail_matrice_marque', { p_debut: debut, p_fin: fin }),
        supabase.rpc('briefs_marque'),
      ]);
      const lectureSeule = matrix.error?.code === 'PGRST202';
      if ((matrix.error && !lectureSeule) || briefs.error)
        throw new Error('Le Studio est momentanément indisponible.');
      let data = matrix.data as Matrice;
      if (lectureSeule) {
        const medias = await supabase.rpc('creas_marque');
        if (medias.error) throw medias.error;
        type Media = Pick<Rendu, 'id' | 'format' | 'fichiers' | 'apercu' | 'angle'> & {
          concept: string;
          statut_client: string;
          envoyee_client_le: string;
        };
        data = {
          mesures: [],
          creations: ((medias.data ?? []) as Media[]).map((m) => ({
            id: m.id,
            titre: m.concept,
            format: m.format,
            fichiers: m.fichiers ?? [],
            apercu: m.apercu,
            angle: m.angle,
            statut: m.statut_client,
            partage: m.envoyee_client_le,
            persona: null,
            sous_persona: null,
            sous_angle: null,
            cible: null,
            etape: null,
            changement: null,
            test_prevu_le: null,
            brief: null,
          })),
        };
      }
      const images: Record<string, string> = {};
      const chemins = [
        ...new Set(
          data.creations.flatMap((c) => [c.apercu, ...c.fichiers]).filter((s): s is string => !!s),
        ),
      ];
      for (let i = 0; i < chemins.length; i += 100) {
        const { data: liens } = await supabase.storage
          .from('studio')
          .createSignedUrls(chemins.slice(i, i + 100), 3600);
        for (const lien of liens ?? [])
          if (lien.path && lien.signedUrl) images[lien.path] = lien.signedUrl;
      }
      if (actif) setEtat({ cle, data: { ...data, lectureSeule, briefs: briefs.data ?? [], images } });
    }
    const charger = () => {
      void lire().catch(() => {
        if (actif) setEtat({ cle, erreur: 'Impossible de charger les créations partagées.' });
      });
    };
    charger();
    const minuterie = window.setInterval(charger, 50 * 60 * 1000);
    return () => {
      actif = false;
      window.clearInterval(minuterie);
    };
  }, [cle, debut, fin, version]);
  return {
    data: etat?.cle === cle ? etat.data : undefined,
    erreur: etat?.cle === cle ? etat.erreur : undefined,
    recharger: () => {
      setEtat(undefined);
      relire((n) => n + 1);
    },
  };
}
