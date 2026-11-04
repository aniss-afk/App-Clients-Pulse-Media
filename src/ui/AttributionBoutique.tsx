import { useEffect, useState } from 'react';
import { supabase } from '../auth/supabase';
import { euro, nombre } from '../lib';
import type { Periode } from '../services/espaceClient';

interface JourAttribue { jour: string; ca_net: number | string; commandes: number | string }

/** La RPC borne la lecture au mois ou à la fenêtre du tableau et à la marque authentifiée. */
export function AttributionBoutique({ periode, revenuMedia }: { periode: Periode; revenuMedia: number | null }) {
  const [jours, setJours] = useState<JourAttribue[] | null>(null);
  const [echec, setEchec] = useState(false);
  const [essai, setEssai] = useState(0);
  useEffect(() => {
    const controle = new AbortController();
    supabase.rpc('ventes_createurs_marque', {p_debut: periode.debut, p_fin: periode.fin})
      .abortSignal(controle.signal)
      .then(({data, error}) => {
        if (controle.signal.aborted) return;
        setEchec(Boolean(error));
        setJours(error ? null : data ?? []);
      });
    return () => controle.abort();
  }, [periode.debut, periode.fin, essai]);

  const ca = jours?.reduce((s, j) => s + Number(j.ca_net), 0) ?? 0;
  const commandes = jours?.reduce((s, j) => s + Number(j.commandes), 0) ?? 0;
  const valeur = jours?.length ? euro(ca) : '—';
  const sous = echec ? 'Attribution indisponible.' : !jours ? 'Chargement…' : !jours.length
    ? 'Aucun jour de boutique importé.'
    : `${nombre(commandes)} commande${commandes > 1 ? 's' : ''} sur ${jours.length} jour${jours.length > 1 ? 's' : ''} importé${jours.length > 1 ? 's' : ''}.`;
  return (
    <dl className="mt-3 grid gap-px bg-line sm:grid-cols-2 border border-line rounded-card overflow-hidden">
      <div className="bg-paper px-5 py-4">
        <dt className="text-sm font-medium text-ink-muted">CA boutique attribué aux codes créateurs</dt>
        <dd className="mt-1 text-lg font-bold tabular-nums">{valeur}</dd>
        <dd className="mt-1 text-xs text-ink-muted">{sous} {echec && (
          <button type="button" className="underline print:hidden" onClick={() => { setEchec(false); setEssai((n) => n + 1); }}>Réessayer</button>
        )}</dd>
      </div>
      <div className="bg-paper px-5 py-4">
        <dt className="text-sm font-medium text-ink-muted">Revenus déclarés par les régies publicitaires</dt>
        <dd className="mt-1 text-lg font-bold tabular-nums">{revenuMedia === null ? '—' : euro(revenuMedia)}</dd>
        <dd className="mt-1 text-xs text-ink-muted">Plusieurs régies peuvent revendiquer la même commande.</dd>
      </div>
    </dl>
  );
}
