import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { useDonnees } from '../../donnees';
import { lireBilanFinance } from '../../services/pilotageFinancier';
import { montantFinance, type BilanFinance } from '../../services/financeModel';
import { CourbeFinance } from './CourbeFinance';

type Detail = 'sales' | 'costs' | 'profit' | 'margin';
export function PilotageBoutique() {
  const { marque, periode } = useDonnees();
  const key = [marque?.id, periode.debut, periode.fin].join('/');
  const [resultat, setResultat] = useState<{ key: string; data?: BilanFinance; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titreDialog = useId();
  useEffect(() => {
    let ignore = false;
    if (!marque?.id) return;
    setResultat(null); setDetail(null);
    lireBilanFinance(marque.id, periode).then(data => {
      if (!ignore) setResultat({ key, data });
    }).catch((error: Error) => { if (!ignore) setResultat({ key, error: error.message }); });
    return () => { ignore = true; };
  }, [key, marque?.id, periode.debut, periode.fin, retry]);
  useEffect(() => {
    if (detail !== null && !dialog.current?.open) dialog.current?.showModal();
    else if (detail === null && dialog.current?.open) dialog.current.close();
  }, [detail]);
  const data = resultat?.key === key ? resultat.data : undefined;
  if (!marque?.id) return null;
  if (resultat?.key === key && resultat.error) return <section role="alert" className="mb-5 rounded-card border border-line bg-paper p-5"><p>{resultat.error}</p><button type="button" className="mt-3 underline" onClick={() => setRetry(r => r+1)}>Réessayer</button></section>;
  const loading = !data;
  const margin = data?.marginPct == null ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(data.marginPct)+' %';
  const cards: { id: Detail; label: string; value: string }[] = [
    { id: 'sales', label: 'Ventes nettes HT', value: montantFinance(data?.salesCents) },
    { id: 'costs', label: 'Charges', value: montantFinance(data?.costsCents) },
    { id: 'profit', label: 'Bénéfice estimé', value: montantFinance(data?.profitCents) },
    { id: 'margin', label: 'Marge nette', value: margin },
  ];
  const expenses = data?.expenses ?? [];
  const maxExpense = Math.max(1, ...expenses.map(e => Math.abs(e.amountCents ?? 0)));
  const title = ({ sales: 'Ventes nettes HT', costs: 'Charges', profit: 'Bénéfice estimé', margin: 'Marge nette' }[detail ?? 'sales'] || 'Détail');
  return <section aria-label="Bilan de la boutique" aria-busy={loading} className="mb-6">
    <div className="grid grid-cols-2 lg:grid-cols-[1.2fr_1.05fr_1.5fr_.8fr] gap-2.5">
      {cards.map(c => <button key={c.id} type="button" data-finance-kpi={c.id} disabled={loading} onClick={() => setDetail(c.id)} className={`min-w-0 text-left px-4 py-3 rounded-box border ${c.id==='profit'?'bg-red-pale border-transparent':'bg-paper border-line'} disabled:opacity-60 hover:border-line-strong`}>
        <span className="block text-xs text-ink-muted">{c.label}</span><strong className={`block mt-2 text-xl sm:text-2xl tabular-nums tracking-tight whitespace-nowrap ${c.id==='profit'?'text-red-ink':''}`}>{loading?'…':c.value}</strong>
      </button>)}
    </div>
    {data && (!data.coverage.salesComplete || !data.coverage.costsComplete) && <button type="button" onClick={() => setDetail('costs')} className="mt-3 text-xs text-ink-muted underline underline-offset-2">Données à compléter</button>}
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3 mt-4">
      <article className="min-w-0 rounded-card border border-line bg-paper p-4"><div className="flex items-center justify-between gap-2 mb-4"><h2 className="font-semibold">Ventes et bénéfice cumulés</h2><button type="button" disabled={loading} onClick={() => setDetail('sales')} aria-label="Voir les chiffres par jour" className="p-2"><ArrowUpRight className="w-4 h-4" /></button></div>{loading?<p role="status" className="py-14 text-center text-sm text-ink-muted">Chargement du bilan…</p>:<CourbeFinance points={data!.trend} />}</article>
      <article className="min-w-0 rounded-card border border-line bg-paper p-4"><div className="flex items-center justify-between gap-2 mb-3"><h2 className="font-semibold">Charges</h2><button type="button" disabled={loading} onClick={() => setDetail('costs')} aria-label="Voir le détail des charges" className="p-2"><ArrowUpRight className="w-4 h-4" /></button></div>
        <dl className="grid gap-2.5">{expenses.map(e => <div key={e.id}><div className="flex justify-between gap-3 text-xs"><dt>{e.label}</dt><dd className="tabular-nums whitespace-nowrap">{montantFinance(e.amountCents)}</dd></div><svg viewBox="0 0 100 3" preserveAspectRatio="none" className="h-1 w-full mt-1.5" aria-hidden="true"><rect width="100" height="3" rx="1" className="fill-inset" /><rect width={Math.abs(e.amountCents??0)/maxExpense*100} height="3" rx="1" className="fill-red-ink" /></svg></div>)}</dl>
      </article>
    </div>
    <dialog ref={dialog} aria-labelledby={titreDialog} onClose={() => { if (!dialog.current?.open) setDetail(null); }} className="rounded-card border border-line bg-paper text-ink w-[calc(100%-24px)] max-w-xl p-0 max-h-[85vh] backdrop:bg-black/20">
      <header className="sticky top-0 flex justify-between items-center gap-3 p-5 bg-paper border-b border-line"><h2 id={titreDialog} className="font-semibold text-lg">{title}</h2><button type="button" autoFocus onClick={() => setDetail(null)} aria-label="Fermer le détail" className="p-2"><X className="w-4 h-4" /></button></header>
      {data && <div className="p-5">
        {detail==='costs' ? <><dl className="divide-y divide-line">{expenses.map(e=><div key={e.id} className="py-3"><div className="flex justify-between gap-3"><dt>{e.label}</dt><dd className="tabular-nums whitespace-nowrap">{montantFinance(e.amountCents)}</dd></div><p className="text-xs text-ink-muted mt-1">{e.complete?'Pris en compte':'À compléter'}</p></div>)}</dl>{!data.coverage.costsComplete && <p className="mt-4 text-sm text-ink-muted">Le bénéfice sera disponible après vérification des charges par votre équipe.</p>}</> : detail==='sales' ? <><p className="text-sm text-ink-muted mb-4">Ventes après remises et remboursements, hors taxes. Une commande compte une seule fois, selon son dernier canal identifiable ou son code créateur. Cela ne mesure pas toute l’influence de chaque canal.</p><h3 className="font-semibold mb-2">Origine des ventes</h3><dl className="divide-y divide-line mb-5">{data.sources.map(s=><div key={s.id} className="flex justify-between gap-3 py-2 text-sm"><dt>{s.label}</dt><dd className="tabular-nums whitespace-nowrap">{montantFinance(s.amountCents)}</dd></div>)}</dl><h3 className="font-semibold mb-2">Par jour</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-ink-muted"><th className="text-left py-2">Date</th><th className="text-right">Ventes HT</th><th className="text-right">Bénéfice</th></tr></thead><tbody>{data.trend.map(p=><tr key={p.date} className="border-t border-line"><th className="text-left py-2 font-normal">{p.date.slice(8)}/{p.date.slice(5,7)}</th><td className="text-right tabular-nums whitespace-nowrap">{montantFinance(p.salesCents)}</td><td className="text-right tabular-nums whitespace-nowrap">{montantFinance(p.profitCents)}</td></tr>)}</tbody></table></div></> : <><dl className="divide-y divide-line">{[{label:'Ventes nettes HT',value:montantFinance(data.salesCents)},{label:'Charges',value:montantFinance(data.costsCents)},{label:'Bénéfice estimé',value:montantFinance(data.profitCents)},{label:'Marge nette',value:margin}].map(r=><div key={r.label} className="flex justify-between gap-3 py-3"><dt>{r.label}</dt><dd className="tabular-nums whitespace-nowrap">{r.value}</dd></div>)}</dl><p className="text-sm text-ink-muted mt-4">Les commissions sont incluses dans les charges. Leur règlement n’est pas une deuxième dépense. Ce résultat dépend des coûts renseignés pour la période.</p></>}
      </div>}
    </dialog>
  </section>;
}
