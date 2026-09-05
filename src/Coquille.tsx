import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Clapperboard, FileText, History, Route, Sun, TrendingUp } from 'lucide-react';
import { DonneesProvider, useDonnees } from './donnees';
import { periodeGlissante } from './services/espaceClient';
import { cn } from './lib';

const ONGLETS = [
  { chemin: '/', libelle: "Aujourd'hui", exact: true, Icone: Sun },
  { chemin: '/creations', libelle: 'Créations', compteur: true, Icone: Clapperboard },
  { chemin: '/performance', libelle: 'Performance', Icone: TrendingUp },
  { chemin: '/journal', libelle: 'Journal', Icone: History },
  { chemin: '/roadmap', libelle: 'Roadmap', Icone: Route },
  { chemin: '/rapports', libelle: 'Rapports', Icone: FileText },
] as const;

const CHOIX = [7, 30, 90];

/**
 * La barre latérale.
 *
 * Un rail d'icônes de 64 px qui s'ouvre au survol par-dessus le
 * contenu : la page ne se redistribue pas. Le survol passe par
 * `group-hover`, donc sans état ni délai, et le clavier l'ouvre aussi
 * via `focus-within`.
 */
function Barre({ etendue = false, onNaviguer }: { etendue?: boolean; onNaviguer?: () => void }) {
  const { creations, periode, setPeriode } = useDonnees();
  const aValider = creations.filter((c) => c.statut === 'a_valider').length;
  const longueur =
    Math.round((new Date(periode.fin).getTime() - new Date(periode.debut).getTime()) / 86_400_000) + 1;

  const ouvert = etendue
    ? ''
    : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150';
  const ferme = etendue ? 'hidden' : 'group-hover:hidden group-focus-within:hidden';

  const lien = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex items-center gap-3 h-10 px-3 rounded-box text-md whitespace-nowrap transition-colors',
      isActive ? 'bg-ink text-paper font-medium' : 'text-ink-muted hover:text-ink hover:bg-inset',
    );

  return (
    <aside
      className={cn(
        'group h-full bg-paper border-r border-line flex flex-col py-6 px-3 overflow-hidden transition-[width] duration-200 ease-out',
        etendue ? 'w-56' : 'w-16 hover:w-56 focus-within:w-56 hover:shadow-lift md:min-h-screen',
      )}
    >
      <div className="relative h-7 mb-8 px-1.5">
        <img src="/favicon.png" alt="" width={28} height={28} className={cn(ferme, 'h-7 w-7 rounded-box')} />
        <img
          src="/logo.webp"
          alt="Pulse Media"
          width={112}
          height={46}
          className={cn(ouvert, 'absolute left-1.5 top-0.5 h-[24px] w-auto')}
        />
      </div>

      <nav className="flex flex-col gap-0.5">
        {ONGLETS.map((o) => {
          const n = 'compteur' in o && o.compteur ? aValider : 0;
          return (
            <NavLink
              key={o.chemin}
              to={o.chemin}
              end={'exact' in o ? o.exact : false}
              onClick={onNaviguer}
              className={lien}
              title={etendue ? undefined : o.libelle}
            >
              <o.Icone className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className={ouvert}>{o.libelle}</span>
              {n > 0 && (
                <>
                  <span className={cn(ferme, 'absolute left-6 top-1 min-w-[16px] h-4 px-1 rounded-pill bg-red text-paper text-[10px] font-semibold leading-4 text-center')}>
                    {n}
                  </span>
                  <span className={cn(ouvert, 'ml-auto text-micro font-semibold px-1.5 py-0.5 rounded-pill bg-red text-paper')}>
                    {n}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="relative min-h-[58px]">
          <div className={cn(ferme, 'flex flex-col items-center gap-1 text-ink-muted')} title="Période">
            <CalendarDays className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
            <span className="text-[11px] font-semibold tabular-nums">{longueur} j</span>
          </div>
          <div className={cn(ouvert, 'absolute inset-x-0 top-0', etendue && 'static')}>
            <div className="text-micro font-semibold uppercase text-ink-faint px-3 mb-2">Période</div>
            <div className="flex gap-1 px-2">
              {CHOIX.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPeriode(periodeGlissante(n))}
                  className={cn(
                    'flex-1 py-1.5 rounded-pill text-sm transition-colors',
                    longueur === n ? 'bg-ink text-paper font-medium' : 'text-ink-muted hover:text-ink hover:bg-inset',
                  )}
                >
                  {n} j
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Coquille() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    document.addEventListener('keydown', auClavier);
    return () => document.removeEventListener('keydown', auClavier);
  }, [menu]);

  return (
    <DonneesProvider>
      <div className="min-h-screen bg-cream text-ink md:flex">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-line bg-paper">
          <img src="/logo.webp" alt="Pulse Media" className="h-[20px] w-auto" />
          <button
            type="button"
            aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="w-10 h-10 -mr-2 flex flex-col items-center justify-center gap-[5px]"
          >
            <span className={cn('block w-5 h-[2px] bg-ink transition-transform', menu && 'translate-y-[7px] rotate-45')} />
            <span className={cn('block w-5 h-[2px] bg-ink transition-opacity', menu && 'opacity-0')} />
            <span className={cn('block w-5 h-[2px] bg-ink transition-transform', menu && '-translate-y-[7px] -rotate-45')} />
          </button>
        </header>

        {menu && (
          <div className="md:hidden fixed inset-0 top-14 z-20 flex">
            <div className="h-full overflow-y-auto shadow-lift">
              <Barre etendue onNaviguer={() => setMenu(false)} />
            </div>
            <div className="flex-1 bg-[var(--overlay)]" onClick={() => setMenu(false)} aria-hidden="true" />
          </div>
        )}

        {/* Le rail réserve 64 px ; l'aside est fixe et s'élargit par-dessus
            le contenu, qui ne se redistribue donc pas au survol. */}
        <div className="hidden md:block w-16 shrink-0" />
        <div className="hidden md:block fixed inset-y-0 left-0 z-30">
          <Barre />
        </div>

        <main className="flex-1 min-w-0 w-full mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-9 max-w-[1600px] animate-rise">
          <Outlet />
        </main>
      </div>
    </DonneesProvider>
  );
}
