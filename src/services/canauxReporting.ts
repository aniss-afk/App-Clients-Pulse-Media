import { supabase } from '../auth/supabase';
import type { Periode } from './espaceClient';
export const SOURCES_REPORTING = {
  meta: 'Meta Ads', google: 'Google Ads', tiktok: 'TikTok Ads', pinterest: 'Pinterest Ads',
  search_console: 'SEO · Google', ga4: 'Trafic et parcours', klaviyo: 'Emailing',
} as const;
export type SourceId = keyof typeof SOURCES_REPORTING;
export interface SourceEtat { plateforme: string; statut: string; derniere_sync: string | null; derniere_erreur: string | null; active: boolean }
export interface MesureSource { plateforme: string; date: string; dimensions: Record<string,string>; mesures: Record<string,number>; devise: string | null }
export interface RapportSource { plateforme: string; debut: string; fin: string; rapport: { totaux?: Record<string,number>; limites?: string[]; partiel?: boolean }; maj_le: string }
export interface MesurePublicitaire { plateforme: string; date: string; depense: number | null; impressions: number | null; clics: number | null; revenu_attribue: number | null }
export interface ReportingClient { etats: SourceEtat[]; mesures: MesureSource[]; publicite: MesurePublicitaire[]; rapports: RapportSource[]; couverture: {plateforme:string;date:string}[] }
export async function lireReportingClient(clientId: string, periode: Periode): Promise<ReportingClient> {
  const lireMesures = async () => {
    const rows: MesureSource[] = [];
    for(let n=0;;n+=500) {
      const {data,error} = await supabase.from('source_mesures_jour').select('plateforme,date,dimensions,mesures,devise')
        .eq('client_id',clientId).gte('date',periode.debut).lte('date',periode.fin).order('date').order('plateforme').order('dimensions').range(n,n+499);
      if(error) throw error;
      rows.push(...data as MesureSource[]);
      if(data.length<500) return rows;
    }
  };
  const lirePublicite = async () => {
    const rows: MesurePublicitaire[] = [];
    for (let n=0;;n+=500) {
      const {data,error} = await supabase.from('metriques_jour').select('plateforme,date,depense,impressions,clics,revenu_attribue')
        .eq('client_id',clientId).gte('date',periode.debut).lte('date',periode.fin).order('date').order('plateforme').range(n,n+499);
      if(error) throw error;
      rows.push(...data as MesurePublicitaire[]);
      if(data.length<500) return rows;
    }
  };
  const lireCouverture = async () => {
    const rows: ReportingClient['couverture'] = [];
    for (let n=0;;n+=500) {
      const {data,error} = await supabase.from('source_couverture').select('plateforme,date').eq('client_id',clientId)
        .gte('date',periode.debut).lte('date',periode.fin).order('date').order('plateforme').range(n,n+499);
      if(error) throw error;
      rows.push(...data);
      if(data.length<500) return rows;
    }
  };
  const [etats, mesures, rapports, couverture, publicite] = await Promise.all([
    supabase.rpc('sources_reporting',{p_client:clientId}), lireMesures(),
    supabase.from('source_rapports').select('plateforme,debut,fin,rapport,maj_le').eq('client_id',clientId)
      .eq('debut',periode.debut).eq('fin',periode.fin).order('plateforme'),
    lireCouverture(), lirePublicite(),
  ]);
  if(etats.error || rapports.error) throw new Error('Le détail des canaux est momentanément indisponible.');
  return {etats:etats.data??[],mesures,publicite,rapports:rapports.data??[],couverture};
}
