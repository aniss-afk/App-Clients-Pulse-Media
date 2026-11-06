import { supabase } from '../auth/supabase';
import type { Periode } from './espaceClient';
import { bilanValide, type BilanFinance } from './financeModel';
export async function lireBilanFinance(clientId: string, periode: Periode): Promise<BilanFinance> {
  const { data, error } = await supabase.rpc('pilotage_financier', {
    p_client: clientId, p_debut: periode.debut, p_fin: periode.fin,
  });
  if (error) throw new Error('Le bilan financier est indisponible. Réessayez ou contactez votre équipe Pulse.');
  return bilanValide(data);
}
