import { useDonnees } from '../donnees';
import { Entete, Vide, Zone } from '../ui/pieces';
import { NOM_CANAL } from '../services/espaceClient';
import { dateLongue } from '../lib';

/**
 * Ce qu'on a fait sur le compte.
 *
 * Une ligne par action de l'agence, avec la raison et, quand il est
 * mesuré, le résultat. C'est le travail que la marque paie, rendu
 * lisible ; les chiffres sont ailleurs. Le résultat manque tant qu'on
 * ne l'a pas mesuré — c'est voulu.
 */
export function Journal() {
  const { actions, chargement } = useDonnees();

  if (chargement) return <Vide>Chargement…</Vide>;

  const triees = [...actions].sort((a, b) => (a.date < b.date ? 1 : -1));

  /* Groupées par semaine : le rythme de lecture d'une marque, et celui
     de la synthèse. */
  const semaines = new Map<string, typeof triees>();
  for (const a of triees) {
    const d = new Date(a.date);
    const lundi = new Date(d);
    lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const cle = lundi.toISOString().slice(0, 10);
    semaines.set(cle, [...(semaines.get(cle) ?? []), a]);
  }

  return (
    <>
      <Entete
        titre="Journal"
        sous="Chaque action menée sur votre compte, pourquoi, et ce que ça a donné."
      />

      {[...semaines.entries()].map(([lundi, lignes]) => (
        <Zone key={lundi} titre={`Semaine du ${dateLongue(lundi)}`} compte={lignes.length}>
          <ul className="divide-y divide-line">
            {lignes.map((a) => (
              <li key={a.id} className="px-5 py-4 flex gap-5">
                <div className="w-[104px] shrink-0">
                  <div className="text-sm text-ink-faint tabular-nums">
                    {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs font-medium text-ink-muted mt-0.5">{NOM_CANAL[a.canal]}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-medium">{a.action}</p>
                  <p className="text-sm text-ink-muted mt-1 leading-relaxed">{a.raison}</p>
                  <p className={`text-sm mt-1.5 leading-relaxed ${a.resultat ? 'text-ink' : 'text-ink-faint'}`}>
                    {a.resultat ? <>→ {a.resultat}</> : 'Résultat en cours d’observation.'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Zone>
      ))}
    </>
  );
}
