export interface PointFinance { date: string; salesCents: number | null; costsCents: number | null; profitCents: number | null }
export interface BilanFinance {
  currency: string; salesCents: number | null; costsCents: number | null; profitCents: number | null; marginPct: number | null;
  knownCostsCents: number; orders: number | null; codesSalesCents: number | null; commissionsCents: number | null;
  spendCents: number | null; coverage: { salesComplete: boolean; costsComplete: boolean; missing: string[] };
  sources: { id: string; label: string; amountCents: number | null }[];
  expenses: { id: string; label: string; amountCents: number | null; complete: boolean; source: string }[];
  trend: PointFinance[];
}
export function montantFinance(cents: number | null | undefined): string {
  return typeof cents === 'number' && Number.isFinite(cents)
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(cents / 100) : '—';
}
export function bilanValide(data: unknown): BilanFinance {
  const b = data as BilanFinance | null;
  if (!b || b.currency !== 'EUR' || !b.coverage || typeof b.coverage.salesComplete !== 'boolean'
    || typeof b.coverage.costsComplete !== 'boolean' || !Array.isArray(b.coverage.missing)
    || !Array.isArray(b.expenses) || !Array.isArray(b.sources) || !Array.isArray(b.trend)) {
    throw new Error('Le bilan est indisponible. Réessayez ou contactez votre équipe Pulse.');
  }
  const montant = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null;
  const ventes = b.coverage.salesComplete ? montant(b.salesCents) : null;
  const charges = b.coverage.costsComplete ? montant(b.costsCents) : null;
  const complet = ventes !== null && charges !== null;
  return { ...b,
    salesCents: ventes, costsCents: charges,
    profitCents: complet ? montant(b.profitCents) : null,
    marginPct: complet && ventes > 0 ? montant(b.marginPct) : null,
    sources: b.sources.map(s => ({ ...s, amountCents: b.coverage.salesComplete ? montant(s.amountCents) : null })),
    expenses: b.expenses.map(e => ({ ...e, amountCents: e.complete === true ? montant(e.amountCents) : null })),
    trend: b.trend.map(p => ({ ...p,
      salesCents: b.coverage.salesComplete ? montant(p.salesCents) : null,
      costsCents: b.coverage.costsComplete ? montant(p.costsCents) : null,
      profitCents: complet ? montant(p.profitCents) : null,
    })),
  };
}
export function cumulFinance(points: PointFinance[]): PointFinance[] {
  const total: Omit<PointFinance, 'date'> = { salesCents: 0, costsCents: 0, profitCents: 0 };
  return [...points].sort((a,b) => a.date.localeCompare(b.date)).map(p => {
    for (const key of ['salesCents', 'costsCents', 'profitCents'] as const) {
      total[key] = total[key] === null || p[key] === null || !Number.isFinite(p[key]) ? null : total[key]! + p[key]!;
    }
    return { date: p.date, ...total };
  });
}
