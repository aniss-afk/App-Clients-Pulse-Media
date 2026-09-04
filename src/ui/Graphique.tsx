import { dateCourte } from '../lib';

/**
 * Graphique dépense / chiffre d'affaires, en SVG nu.
 *
 * Pas de bibliothèque : deux séries, une échelle, des barres et une
 * ligne. Une bibliothèque de graphiques pèse plus que tout le reste de
 * l'espace et impose sa propre grammaire visuelle — ici la dépense est
 * une barre encre discrète, le CA une ligne rouge, et rien d'autre.
 */
export function GraphiqueDepenseCa({
  points,
  hauteur = 160,
}: {
  points: { date: string; depense: number; ca: number }[];
  hauteur?: number;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-ink-faint py-8 text-center">Aucune donnée sur la période.</p>;
  }

  const largeur = 720;
  const marge = { haut: 8, bas: 22 };
  const h = hauteur - marge.haut - marge.bas;
  const max = Math.max(1, ...points.map((p) => Math.max(p.depense, p.ca)));
  const pas = largeur / points.length;
  const y = (v: number) => marge.haut + h - (v / max) * h;

  const ligne = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * pas + pas / 2} ${y(p.ca)}`)
    .join(' ');

  /* Trois repères de date, jamais plus : le début, le milieu, la fin. */
  const reperes = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className="w-full h-auto"
      role="img"
      aria-label="Dépense publicitaire et chiffre d'affaires par jour"
    >
      {points.map((p, i) => (
        <rect
          key={p.date}
          x={i * pas + pas * 0.2}
          y={y(p.depense)}
          width={pas * 0.6}
          height={Math.max(0, marge.haut + h - y(p.depense))}
          rx={2}
          className="fill-ink/15"
        />
      ))}
      <path d={ligne} fill="none" stroke="#FF3B30" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      {reperes.map((i) => (
        <text
          key={i}
          x={i * pas + pas / 2}
          y={hauteur - 6}
          textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
          className="fill-ink-faint"
          fontSize={11}
        >
          {dateCourte(points[i].date)}
        </text>
      ))}
    </svg>
  );
}

export function Legende() {
  return (
    <div className="flex items-center gap-5 text-xs text-ink-muted">
      <span className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-sm bg-ink/15" /> Dépense pub
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block w-4 h-[2px] bg-red" /> Chiffre d&apos;affaires
      </span>
    </div>
  );
}
