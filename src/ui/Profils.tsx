import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from 'lucide-react';
import { Profil, bouclerSelection, trancherProfil } from '../services/espaceClient';
import { compact } from '../lib';

/**
 * Choisir ses créateurs, un profil à la fois.
 *
 * Une liste pousse à comparer des lignes ; on ne choisit pas quelqu'un
 * sur une ligne. Un profil occupe l'écran, on tranche, on passe au
 * suivant. Le compteur dit combien il en reste : c'est la seule chose
 * qui manque quand on regarde une carte à la fois.
 *
 * Refuser demande une raison. Pas pour la forme : c'est elle qui évite
 * qu'on propose le même genre de profil au tour suivant, et sans elle
 * l'agence recommence à l'aveugle.
 *
 * On peut revenir en arrière et changer d'avis jusqu'à l'envoi. Rien
 * ne part au créateur : il ne saura jamais qu'on l'a écarté.
 */
const NOM_RESEAU: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export function Profils({
  profils,
  onFermer,
  onFait,
}: {
  profils: Profil[];
  onFermer: () => void;
  onFait: () => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<Record<string, { retenu: boolean; avis: string }>>(() =>
    Object.fromEntries(
      profils.filter((p) => p.choix).map((p) => [p.participationId, { retenu: p.choix === 'retenu', avis: p.avis ?? '' }]),
    ),
  );
  const [refus, setRefus] = useState<string | null>(null);
  const [avis, setAvis] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const p = profils[index];
  const decides = Object.keys(choix).length;
  const restants = profils.length - decides;
  const campagne = profils[0]?.campagne ?? '';
  const campagneId = profils[0]?.campagneId ?? '';

  const suivant = useMemo(
    () => () => setIndex((i) => Math.min(profils.length - 1, i + 1)),
    [profils.length],
  );

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return refus ? setRefus(null) : onFermer();
      if (refus) return;
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') suivant();
    };
    document.addEventListener('keydown', clavier);
    return () => document.removeEventListener('keydown', clavier);
  }, [onFermer, suivant, refus]);

  async function trancher(retenu: boolean, raison = '') {
    if (!p) return;
    setErreur(null);
    setEnCours(true);
    try {
      await trancherProfil(p.participationId, retenu, raison);
      setChoix((c) => ({ ...c, [p.participationId]: { retenu, avis: raison } }));
      setRefus(null);
      setAvis('');
      /* On avance tout seul : s'arrêter sur un profil déjà tranché
         oblige à un clic de plus pour rien. Sauf au dernier, où
         avancer ferait sortir de la pile. */
      if (index < profils.length - 1) suivant();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnCours(false);
    }
  }

  async function envoyer() {
    setErreur(null);
    setEnCours(true);
    try {
      await bouclerSelection(campagneId);
      await onFait();
      onFermer();
    } catch (e) {
      setErreur((e as Error).message);
      setEnCours(false);
    }
  }

  if (!p) return null;
  const monChoix = choix[p.participationId];

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-center justify-center p-4 sm:p-8 animate-rise"
      role="dialog"
      aria-modal="true"
      aria-label={`Profil ${index + 1} sur ${profils.length}`}
    >
      <div className="w-full max-w-[620px] max-h-full overflow-y-auto rounded-card bg-paper border border-line shadow-lift">
        {/* L'en-tête ne défile pas avec le contenu : savoir où on en est
            ne doit pas demander de remonter. */}
        <div className="sticky top-0 z-10 bg-paper border-b border-line px-6 py-4 flex items-center gap-4">
          <span className="text-sm text-ink-muted">
            {campagne} · profil {index + 1} sur {profils.length}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {profils.map((x, i) => (
              <button
                key={x.participationId}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Aller au profil ${i + 1}`}
                className={`w-2 h-2 rounded-pill transition-colors ${
                  i === index
                    ? 'bg-ink'
                    : choix[x.participationId]
                      ? choix[x.participationId].retenu ? 'bg-ink/40' : 'bg-red/40'
                      : 'bg-line-strong'
                }`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="w-8 h-8 -mr-2 grid place-items-center rounded-pill text-ink-muted hover:text-ink hover:bg-inset transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-5">
            {p.photo ? (
              <img
                src={p.photo}
                alt=""
                className="w-[88px] h-[88px] rounded-pill object-cover border border-line shrink-0"
              />
            ) : (
              <span className="w-[88px] h-[88px] rounded-pill bg-inset border border-line grid place-items-center text-2xl font-bold text-ink-faint shrink-0">
                {p.prenom.charAt(0)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold tracking-[-0.02em]">{p.prenom}</h2>
              <p className="text-sm text-ink-muted mt-0.5">
                {[p.ville, p.abonnes && `${p.abonnes} abonnés`].filter(Boolean).join(' · ')}
              </p>
              {p.univers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {p.univers.map((u) => (
                    <span key={u} className="text-xs font-medium px-2.5 py-1 rounded-pill bg-inset text-ink-muted">
                      {u}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {p.bio && <p className="text-md leading-relaxed mt-5">{p.bio}</p>}

          {p.argument && (
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-micro font-semibold uppercase text-ink-faint mb-1.5">Pourquoi on vous le propose</p>
              <p className="text-md leading-relaxed">{p.argument}</p>
            </div>
          )}

          {p.reseaux.length > 0 && (
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-micro font-semibold uppercase text-ink-faint mb-2.5">Ses comptes</p>
              <ul className="space-y-1.5">
                {p.reseaux.map((r) => (
                  <li key={`${r.reseau}-${r.handle}`} className="flex items-baseline gap-3 text-md">
                    <span className="text-ink-muted w-[76px] shrink-0">{NOM_RESEAU[r.reseau] ?? r.reseau}</span>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4 decoration-line-strong hover:decoration-ink transition-colors"
                      >
                        {r.handle}
                      </a>
                    ) : (
                      <span className="font-medium">{r.handle}</span>
                    )}
                    {r.abonnes !== null && (
                      <span className="text-ink-faint tabular-nums text-sm">
                        {compact(r.abonnes)}
                        {/* Déclaré, pas vérifié : la nuance compte avant
                            de bâtir une vague dessus. */}
                        {!r.verifie && ' déclarés'}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.exemples.length > 0 && (
            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-micro font-semibold uppercase text-ink-faint mb-2.5">Ses vidéos</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {p.exemples.map((e) => (
                  <a
                    key={e.url}
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={1.9} />
                    {e.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}…
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Le pied non plus ne défile pas : la décision reste sous la
            main quel que soit l'endroit où on lit. */}
        <div className="sticky bottom-0 bg-paper border-t border-line px-6 py-4">
          {erreur && (
            <p className="mb-3 px-3.5 py-2.5 rounded-box bg-red-pale text-sm text-red-ink" role="alert">
              {erreur}
            </p>
          )}

          {refus === p.participationId ? (
            <div>
              <label className="block">
                <span className="text-sm font-semibold">Pourquoi il ne convient pas</span>
                <textarea
                  autoFocus
                  rows={2}
                  value={avis}
                  onChange={(e) => setAvis(e.target.value)}
                  placeholder="Audience trop jeune pour le produit."
                  className="mt-2 w-full rounded-box border border-line-strong bg-paper px-4 py-3 text-md outline-none transition-colors focus:border-ink placeholder:text-ink-faint"
                />
              </label>
              <p className="text-xs text-ink-faint mt-1.5">
                Lu par nous seuls. Le créateur ne saura jamais qu&apos;il a été proposé.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={enCours || avis.trim().length < 3}
                  onClick={() => void trancher(false, avis.trim())}
                  className="inline-flex items-center gap-2 rounded-pill bg-ink text-paper px-5 py-2.5 text-base font-medium transition-colors hover:bg-ink/90 disabled:opacity-40"
                >
                  {enCours && <Loader2 className="w-4 h-4 animate-spin" />} Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => { setRefus(null); setAvis(''); }}
                  className="rounded-pill border border-line-strong px-5 py-2.5 text-base font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                aria-label="Profil précédent"
                className="w-9 h-9 grid place-items-center rounded-pill border border-line-strong text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={suivant}
                disabled={index === profils.length - 1}
                aria-label="Profil suivant"
                className="w-9 h-9 grid place-items-center rounded-pill border border-line-strong text-ink-muted hover:text-ink transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => { setRefus(p.participationId); setAvis(monChoix?.retenu === false ? monChoix.avis : ''); }}
                  className={`rounded-pill border px-5 py-2.5 text-base font-medium transition-colors disabled:opacity-40 ${
                    monChoix && !monChoix.retenu
                      ? 'border-red-soft bg-red-pale text-red-ink'
                      : 'border-line-strong text-ink-muted hover:text-ink'
                  }`}
                >
                  Pas celui-là
                </button>
                <button
                  type="button"
                  disabled={enCours}
                  onClick={() => void trancher(true)}
                  className={`inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-base font-medium transition-colors disabled:opacity-40 ${
                    monChoix?.retenu ? 'bg-ink text-paper' : 'border border-ink text-ink hover:bg-ink hover:text-paper'
                  }`}
                >
                  {enCours ? <Loader2 className="w-4 h-4 animate-spin" /> : monChoix?.retenu && <Check className="w-4 h-4" strokeWidth={2.4} />}
                  Je le veux
                </button>
              </div>
            </div>
          )}

          {restants === 0 && refus === null && (
            <div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center gap-3">
              <p className="text-sm text-ink-muted flex-1 min-w-[200px]">
                Les {profils.length} profils sont tranchés. On reprend la main après votre envoi.
              </p>
              <button
                type="button"
                disabled={enCours}
                onClick={() => void envoyer()}
                className="inline-flex items-center gap-2 rounded-pill bg-ink text-paper px-5 py-2.5 text-base font-medium transition-colors hover:bg-ink/90 disabled:opacity-40"
              >
                {enCours && <Loader2 className="w-4 h-4 animate-spin" />} Envoyer ma sélection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
