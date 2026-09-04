import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDonnees } from '../donnees';
import { Case, Entete, Rangee, Tableau, Vide, Zone } from '../ui/pieces';
import { bilan, periodeDuMois } from '../services/espaceClient';
import { euro, mois as libelleMois, ratio } from '../lib';

/**
 * Les rapports mensuels.
 *
 * Un mois par ligne, du plus récent au plus ancien. Le rapport lui-même
 * s'ouvre sur sa propre page, sans barre latérale, pour être imprimé
 * ou enregistré en PDF.
 */
export function Rapports() {
  const d = useDonnees();

  /* Les mois où il s'est passé quelque chose, déduits des données plutôt
     que d'une liste écrite à la main qui finirait par diverger. */
  const lignes = useMemo(() => {
    const mois = [...new Set(d.ca.map((c) => c.date.slice(0, 7)))].sort().reverse();
    return mois.map((m) => ({ mois: m, bilan: bilan(d.metriques, d.ca, periodeDuMois(m)) }));
  }, [d.metriques, d.ca]);

  if (d.chargement) return <Vide>Chargement…</Vide>;

  const courant = d.periode.fin.slice(0, 7);

  return (
    <>
      <Entete titre="Rapports" sous="Un rapport par mois, à ouvrir, imprimer ou enregistrer." />

      <Zone titre="Mensuels" compte={lignes.length}>
        {lignes.length === 0 ? (
          <Vide>Aucun rapport disponible.</Vide>
        ) : (
          <Tableau colonnes={['Mois', 'Dépense', "Chiffre d'affaires", 'Retour', '']}>
            {lignes.map((l) => (
              <Rangee key={l.mois}>
                <Case>
                  <span className="font-medium">{libelleMois(l.mois)}</span>
                  {l.mois === courant && (
                    <span className="text-[11px] text-ink-faint ml-2">en cours</span>
                  )}
                </Case>
                <Case mono aDroite>{euro(l.bilan.depense)}</Case>
                <Case mono aDroite>{euro(l.bilan.ca)}</Case>
                <Case mono aDroite>{ratio(l.bilan.mer)}</Case>
                <Case aDroite>
                  <Link
                    to={`/rapports/${l.mois}`}
                    className="text-sm underline underline-offset-4 hover:text-ink text-ink-muted"
                  >
                    Ouvrir
                  </Link>
                </Case>
              </Rangee>
            ))}
          </Tableau>
        )}
      </Zone>
    </>
  );
}
