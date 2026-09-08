import { useState } from 'react';
import { dateCourte, euro } from '../lib';

/**
 * Dépense publicitaire et chiffre d'affaires, jour par jour.
 *
 * Pas de bibliothèque : deux séries, une échelle, des barres et une
 * ligne. Une bibliothèque de graphiques pèse plus que tout le reste de
 * l'espace et impose sa propre grammaire.
 *
 * Trois choses le rendaient illisible, et elles tenaient toutes à la
 * même cause. Les dates et le trait vivaient dans le SVG, qui s'étire
 * à la largeur du conteneur : un texte de 11 px dessiné dans un canevas
 * de 720 px s'affichait à 20 px sur un écran large, et le trait
 * grossissait avec lui. Ce qui restait ne portait aucun chiffre : ni
 * repère, ni valeur au survol, donc rien à lire.
 *
 * Le SVG ne dessine plus que les formes, avec un trait de largeur
 * fixe ; les dates, le repère haut et la lecture du jour sont du HTML,
 * à leur taille réelle. Les deux séries partagent une échelle parce
 * qu'elles partagent une unité : l'écart entre la barre et la ligne
 * est la marge, et c'est précisément ce qu'on vient voir.
 */
export function GraphiqueDepenseCa({
  points,
  hauteur = 180,
}: {
  points: { date: string; depense: number; ca: number }[];
  hauteur?: number;
}) {
  const [survol, setSurvol] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-ink-faint py-8 text-center">Aucune donnée sur la période.</p>;
  }

  const largeur = 720;
  const max = Math.max(1, ...points.map((p) => Math.max(p.depense, p.ca)));
  const pas = largeur / points.length;
  const y = (v: number) => hauteur - (v / max) * hauteur;

  const ligne = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * pas + pas / 2} ${y(p.ca)}`)
    .join(' ');

  const jour = survol === null ? null : points[survol];
  const totalCa = points.reduce((s, p) => s + p.ca, 0);
  const totalDepense = points.reduce((s, p) => s + p.depense, 0);
  const retour = (ca: number, d: number) =>
    d > 0 ? `${(ca / d).toFixed(1).replace('.', ',')}×` : '—';

  return (
    <div>
      {/* La lecture. Au repos, les totaux de la période ; au survol, le
          jour pointé. Elle remplace la légende : nommer les séries en
          affichant leur valeur vaut mieux que deux pastilles muettes. */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4 min-h-[34px]">
        <span className="text-sm text-ink-faint w-[76px] shrink-0 tabular-nums">
          {jour ? dateCourte(jour.date) : 'Période'}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="inline-block w-4 h-[2px] bg-red translate-y-[-4px]" aria-hidden="true" />
          <span className="text-sm text-ink-muted">Ventes</span>
          <span className="text-base font-semibold tabular-nums">{euro(jour ? jour.ca : totalCa)}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-ink/15 translate-y-[1px]" aria-hidden="true" />
          <span className="text-sm text-ink-muted">Pub</span>
          <span className="text-base font-semibold tabular-nums">{euro(jour ? jour.depense : totalDepense)}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="text-sm text-ink-muted">Retour</span>
          <span className="text-base font-semibold tabular-nums">
            {jour ? retour(jour.ca, jour.depense) : retour(totalCa, totalDepense)}
          </span>
        </span>
      </div>

      <div
        className="relative"
        style={{ height: hauteur }}
        onMouseLeave={() => setSurvol(null)}
      >
        {/* Le plafond, chiffré : sans lui la hauteur d'une barre ne se
            convertit en rien. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line pointer-events-none" />
        <span className="absolute right-0 -top-0.5 text-[11px] text-ink-faint tabular-nums bg-paper pl-2 pointer-events-none">
          {euro(max)}
        </span>

        <svg
          viewBox={`0 0 ${largeur} ${hauteur}`}
          preserveAspectRatio="none"
          className="w-full block"
          style={{ height: hauteur }}
          role="img"
          aria-label="Dépense publicitaire et chiffre d'affaires par jour"
        >
          {points.map((p, i) => (
            <rect
              key={p.date}
              x={i * pas + pas * 0.2}
              y={y(p.depense)}
              width={pas * 0.6}
              height={Math.max(0, hauteur - y(p.depense))}
              className={i === survol ? 'fill-ink/35' : 'fill-ink/15'}
            />
          ))}
          <path
            d={ligne}
            fill="none"
            stroke="#FF3B30"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            /* La largeur du trait ne suit pas l'étirement du canevas,
               sinon elle double sur un écran large. */
            vectorEffect="non-scaling-stroke"
          />
          {survol !== null && (
            <circle cx={survol * pas + pas / 2} cy={y(points[survol].ca)} r={3.5} fill="#FF3B30" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {/* Une colonne invisible par jour : pointer n'importe où dans la
            hauteur suffit, viser une barre de trois pixels non. */}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <button
              key={p.date}
              type="button"
              tabIndex={-1}
              aria-label={`${dateCourte(p.date)} : ${euro(p.ca)} de ventes, ${euro(p.depense)} de publicité`}
              onMouseEnter={() => setSurvol(i)}
              onFocus={() => setSurvol(i)}
              className={`flex-1 min-w-0 ${i === survol ? 'bg-ink/[0.03]' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Les dates en HTML : dans le SVG elles grandissaient avec le
          conteneur, jusqu'à peser plus lourd que la courbe. */}
      <div className="flex justify-between mt-2.5 text-xs text-ink-faint tabular-nums">
        <span>{dateCourte(points[0].date)}</span>
        {points.length > 2 && <span>{dateCourte(points[Math.floor(points.length / 2)].date)}</span>}
        <span>{dateCourte(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
