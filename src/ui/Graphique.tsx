import { useState } from 'react';
import { dateCourte, euro } from '../lib';
import type { PointJour } from '../services/mesures';

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
 * qu'elles partagent une unité. L’écart ne tient pas compte des autres
 * charges et ne constitue pas une marge nette.
 */
export function GraphiqueDepenseCa({
  points,
  hauteur = 180,
}: {
  points: PointJour[];
  hauteur?: number;
}) {
  const [survol, setSurvol] = useState<string | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-ink-faint py-8 text-center">Aucune donnée sur la période.</p>;
  }

  const largeur = 720;
  const valeurs = points.flatMap(p => [p.depense, p.ca]).filter((v): v is number => v !== null && Number.isFinite(v));
  const max = Math.max(1, ...valeurs);
  const min = Math.min(0, ...valeurs);
  const pas = largeur / points.length;
  const y = (v: number) => hauteur - ((v - min) / (max - min)) * hauteur;
  const zero = y(0);

  let continu = false;
  const ligne = points.map((p, i) => {
    if (p.ca === null) { continu = false; return ''; }
    const commande = continu ? 'L' : 'M';
    continu = true;
    return `${commande} ${i * pas + pas / 2} ${y(p.ca)}`;
  }).join(' ');

  // La date reste stable si la période change pendant le survol.
  const index = points.findIndex(p => p.date === survol);
  const jour = index < 0 ? null : points[index];
  const total = (cle: 'ca' | 'depense') => points.every(p => p[cle] !== null)
    ? points.reduce((s, p) => s + p[cle]!, 0) : null;
  const totalCa = total('ca'), totalDepense = total('depense');
  const montant = (v: number | null) => v === null ? '—' : euro(v);
  const retour = (ca: number | null, d: number | null) =>
    ca !== null && d !== null && d > 0 ? `${(ca / d).toFixed(1).replace('.', ',')}×` : '—';

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
          <span className="text-base font-semibold tabular-nums">{montant(jour ? jour.ca : totalCa)}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-ink/15 translate-y-[1px]" aria-hidden="true" />
          <span className="text-sm text-ink-muted">Pub</span>
          <span className="text-base font-semibold tabular-nums">{montant(jour ? jour.depense : totalDepense)}</span>
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
          {points.map((p, i) => p.depense === null ? null : (
            <rect
              key={p.date}
              x={i * pas + pas * 0.2}
              y={Math.min(zero, y(p.depense))}
              width={pas * 0.6}
              height={Math.abs(zero - y(p.depense))}
              className={i === index ? 'fill-ink/35' : 'fill-ink/15'}
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
          {jour && jour.ca !== null && (
            <circle cx={index * pas + pas / 2} cy={y(jour.ca)} r={3.5} fill="#FF3B30" vectorEffect="non-scaling-stroke" />
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
              aria-label={`${dateCourte(p.date)} : ${montant(p.ca)} de ventes, ${montant(p.depense)} de publicité`}
              onMouseEnter={() => setSurvol(p.date)}
              onFocus={() => setSurvol(p.date)}
              className={`flex-1 min-w-0 ${i === index ? 'bg-ink/[0.03]' : ''}`}
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
