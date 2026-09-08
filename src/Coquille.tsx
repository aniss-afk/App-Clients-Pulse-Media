import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Clapperboard, LogOut, Route, Settings, TrendingUp } from 'lucide-react';
import { DonneesProvider, useDonnees } from './donnees';
import { deconnecter } from './auth/supabase';
import { useMoi } from './auth/Porte';
import { cn } from './lib';

/**
 * Trois entrées, et le compte en pied de rail.
 *
 * Il y en avait sept, pour deux questions : ce que ça rapporte, et ce
 * que les créateurs font. « Performance » et « Rapports » étaient le
 * même bilan à deux échelles que l'accueil ; « Journal » et
 * « Roadmap » les deux moitiés d'une même frise. Réglages vit dans le
 * menu du compte, comme dans l'espace créateur.
 */
const ONGLETS = [
  { chemin: '/', libelle: 'Résultats', exact: true, Icone: TrendingUp },
  { chemin: '/creations', libelle: 'Créations', compteur: true, Icone: Clapperboard },
  { chemin: '/suivi', libelle: 'Suivi', Icone: Route },
] as const;


/**
 * La barre latérale.
 *
 * Un rail d'icônes de 64 px qui s'ouvre au survol par-dessus le
 * contenu : la page ne se redistribue pas. Le survol passe par
 * `group-hover`, donc sans état ni délai, et le clavier l'ouvre aussi
 * via `focus-within`.
 */
function Barre({ etendue = false, onNaviguer }: { etendue?: boolean; onNaviguer?: () => void }) {
  const { creations } = useDonnees();
  const aValider = creations.filter((c) => c.statut === 'a_valider').length;

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
        <Compte etendue={etendue} ouvert={ouvert} ferme={ferme} onNaviguer={onNaviguer} />
      </div>
    </aside>
  );
}

/**
 * Le compte, en bas du rail.
 *
 * Même geste que dans l'espace créateur : le portrait ouvre un menu
 * avec les réglages et la déconnexion. Il remplace le choix de
 * période, qui vit désormais sur les pages qui s'en servent : un
 * réglage de lecture n'a pas sa place dans la navigation, et il
 * n'était utile que sur deux écrans sur six.
 */
function Compte({
  etendue,
  ouvert,
  ferme,
  onNaviguer,
}: {
  etendue: boolean;
  ouvert: string;
  ferme: string;
  onNaviguer?: () => void;
}) {
  const moi = useMoi();
  const naviguer = useNavigate();
  const [ouvertMenu, setOuvertMenu] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvertMenu) return;
    const dehors = (e: MouseEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvertMenu(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvertMenu(false);
    };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', dehors);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvertMenu]);

  const nom = moi?.marque ?? moi?.nom ?? 'Mon espace';
  const entree =
    'w-full flex items-center gap-2.5 px-3 h-9 rounded-box text-base text-ink-muted hover:text-ink hover:bg-inset transition-colors text-left';

  return (
    <div ref={zone} className="relative min-h-[44px] px-1">
      {ouvertMenu && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-[196px] p-1 rounded-card bg-paper border border-line shadow-lift animate-rise z-10"
        >
          <div className="px-3 pt-2 pb-2.5 border-b border-line mb-1">
            <p className="text-sm font-semibold truncate">{nom}</p>
            <p className="text-xs text-ink-faint truncate">{moi?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            className={entree}
            onClick={() => { setOuvertMenu(false); onNaviguer?.(); naviguer('/reglages'); }}
          >
            <Settings className="w-[17px] h-[17px] shrink-0" strokeWidth={1.75} /> Réglages
          </button>
          <button
            type="button"
            role="menuitem"
            className={entree}
            onClick={() => { setOuvertMenu(false); void deconnecter(); }}
          >
            <LogOut className="w-[17px] h-[17px] shrink-0" strokeWidth={1.75} /> Se déconnecter
          </button>
        </div>
      )}

      {/* `min-h` sur le bouton lui-même : ouvert, son seul enfant visible
          est en position absolue, et sans hauteur imposée le bouton
          s'effondre à zéro, donc devient incliquable au moment précis
          où le rail s'ouvre. */}
      <button
        type="button"
        onClick={() => setOuvertMenu((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvertMenu}
        aria-label="Mon compte"
        className={cn(
          'relative w-full block min-h-[44px] rounded-box hover:bg-inset transition-colors',
          ouvertMenu && 'bg-inset',
        )}
      >
        <span className={cn(ferme, 'absolute inset-0 grid place-items-center')}>
          <Initiale nom={nom} />
        </span>
        <span
          className={cn(ouvert, 'absolute inset-0 flex items-center gap-2.5 px-2', etendue && 'static px-2 py-1.5')}
        >
          <Initiale nom={nom} />
          <span className="text-md font-medium truncate flex-1 text-left">{nom}</span>
        </span>
      </button>
    </div>
  );
}

/** Le portrait d'une marque : sa première lettre, faute de photo. */
function Initiale({ nom }: { nom: string }) {
  return (
    <span className="w-[30px] h-[30px] rounded-pill bg-inset border border-line grid place-items-center text-sm font-semibold text-ink-muted shrink-0">
      {nom.charAt(0).toUpperCase()}
    </span>
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
