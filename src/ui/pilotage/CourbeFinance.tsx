import { useMemo } from 'react';
import { cumulFinance, type PointFinance } from '../../services/financeModel';

export function CourbeFinance({ points }: { points: PointFinance[] }) {
  const cumul = useMemo(() => cumulFinance(points), [points]);
  if (!cumul.length || !cumul.some(p => p.salesCents !== null || p.profitCents !== null)) {
    return <p className="text-sm text-ink-muted py-14 text-center">Ventes en attente de synchronisation.</p>;
  }
  const values = cumul.flatMap(p => [p.salesCents, p.profitCents]).filter((v): v is number => v !== null);
  const min = Math.min(0, ...values), max = Math.max(100, ...values), height = 145;
  const y = (v: number) => 8 + height - ((v - min) / (max - min)) * height;
  const x = (i: number) => 3 + i * 590 / Math.max(1, cumul.length - 1);
  const path = (key: 'salesCents' | 'profitCents') => cumul.map((p, i) => p[key] === null ? '' :
    `${i === 0 || cumul[i-1][key] === null ? 'M' : 'L'} ${x(i)} ${y(p[key]!)}`).join(' ');
  const tick = (v: number) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(v / 100) + ' €';
  const date = (v: string) => new Date(v+'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return <div>
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)]">
    <div aria-hidden="true" className="flex flex-col justify-between text-[10px] text-ink-muted text-right pr-2 h-40 py-2"><span>{tick(max)}</span><span>{tick(min+(max-min)/2)}</span><span>{tick(min)}</span></div>
    <svg viewBox="0 0 600 165" preserveAspectRatio="none" className="block w-full h-40" role="img" aria-label="Ventes nettes et bénéfice cumulés sur la période, en euros">
      <line x1="3" x2="3" y1={y(min)} y2={y(max)} stroke="currentColor" className="text-line-strong" vectorEffect="non-scaling-stroke" />
      {[min, min+(max-min)/2, max].map(v => <line key={v} x1="0" x2="600" y1={y(v)} y2={y(v)} stroke="currentColor" className="text-line-strong" vectorEffect="non-scaling-stroke" />)}
      <path d={path('salesCents')} fill="none" stroke="currentColor" className="text-red-ink" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d={path('profitCents')} fill="none" stroke="currentColor" className="text-ink" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      {cumul.length === 1 && (['salesCents','profitCents'] as const).map(key => cumul[0][key] === null ? null : <circle key={key} cx={x(0)} cy={y(cumul[0][key]!)} r="3" fill="currentColor" className={key==='salesCents'?'text-red-ink':'text-ink'} />)}
    </svg>
    </div>
    <div className="flex justify-between text-xs text-ink-muted mt-1 ml-[3.25rem]"><span>{date(cumul[0].date)}</span><span>{date(cumul[cumul.length-1].date)}</span></div>
    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs text-ink-muted"><span className="flex gap-2 items-center"><i aria-hidden="true" className="w-4 border-t-2 border-red-ink" />Ventes nettes HT</span><span className="flex gap-2 items-center"><i aria-hidden="true" className="w-4 border-t-2 border-dashed border-ink" />Bénéfice estimé</span></div>
  </div>;
}
