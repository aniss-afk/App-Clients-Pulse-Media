import { useEffect, useState } from 'react';
import { supabase } from '../auth/supabase';
import { useMoi } from '../auth/Porte';
import { euro, nombre } from '../lib';
import { Zone } from '../ui/pieces';
type Marche = { pays: string; depense: number; achats: number | null };
export function Marches({ debut, fin }: { debut: string; fin: string }) {
  const moi = useMoi(),
    client = moi?.clientId;
  const [donnees, setDonnees] = useState<Marche[] | null>(null),
    [erreur, setErreur] = useState(false);
  useEffect(() => {
    let actif = true;
    setDonnees(null);
    setErreur(false);
    void supabase
      .rpc('portail_marches_marque', { p_debut: debut, p_fin: fin })
      .then(({ data, error }) => {
        if (actif) {
          setErreur(!!error);
          setDonnees(data ?? []);
        }
      });
    return () => {
      actif = false;
    };
  }, [debut, fin, client]);
  const noms = new Intl.DisplayNames(['fr'], { type: 'region' });
  return (
    <Zone titre="Marchés">
      <div className="p-5">
        {!donnees ? (
          'Chargement…'
        ) : erreur ? (
          'Les données par pays sont indisponibles.'
        ) : !donnees.length ? (
          'Aucune dépense Meta ventilée par pays sur cette période.'
        ) : (
          <details>
            <summary className="cursor-pointer">
              {donnees.length} marché{donnees.length > 1 ? 's' : ''} · Dépense Meta par pays
            </summary>
            <table className="w-full mt-3 text-sm">
              <thead>
                <tr>
                  <th className="text-left">Marché</th>
                  <th className="text-right">Dépense</th>
                  <th className="text-right">Achats Meta</th>
                </tr>
              </thead>
              <tbody>
                {donnees.map((m) => (
                  <tr key={m.pays}>
                    <td>{m.pays === 'XX' ? 'Pays inconnu' : noms.of(m.pays)}</td>
                    <td className="text-right">{euro(m.depense)}</td>
                    <td className="text-right">{m.achats === null ? '—' : nombre(m.achats)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </Zone>
  );
}
