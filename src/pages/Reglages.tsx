import { FormEvent, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Entete, Zone } from '../ui/pieces';
import { useDonnees } from '../donnees';
import { enregistrerMarque } from '../services/espaceClient';

/**
 * Ce que la marque peut corriger elle-même.
 *
 * L'agence a rempli cette fiche en ouvrant le compte, avec ce qu'elle
 * savait au moment de vendre. Rien de tout cela n'est gravé : un site
 * change, un contact part, un secteur se précise.
 *
 * Ce qui n'apparaît pas ici n'est pas un oubli. Le statut, le budget et
 * la date d'entrée décrivent la relation commerciale, pas la marque :
 * ils appartiennent à l'agence, et la base les remet à leur valeur
 * quoi qu'on lui envoie.
 */
const champ =
  'w-full rounded-box border border-line-strong bg-paper px-4 py-3 text-md outline-none transition-colors focus:border-ink placeholder:text-ink-faint';

export function Reglages() {
  const { marque, recharger } = useDonnees();
  const [v, setV] = useState({ nom: '', contact: '', site: '', telephone: '', secteur: '' });
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'fait'>('repos');
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!marque) return;
    setV({
      nom: marque.nom,
      contact: marque.contact,
      site: marque.site,
      telephone: marque.telephone,
      secteur: marque.secteur,
    });
  }, [marque]);

  const set = (k: keyof typeof v) => (val: string) => {
    setV((o) => ({ ...o, [k]: val }));
    setEtat('repos');
    setErreur(null);
  };

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!v.nom.trim()) return setErreur('Le nom de la marque ne peut pas être vide.');
    setEtat('envoi');
    try {
      await enregistrerMarque(v);
      await recharger();
      setEtat('fait');
    } catch (err) {
      setErreur((err as Error).message);
      setEtat('repos');
    }
  }

  return (
    <div className="animate-rise">
      <Entete titre="Réglages" sous="Tes informations, telles qu'on les a. Corrige ce qui a changé." />

      <Zone titre="Ta marque">
        <form onSubmit={envoyer} className="flex flex-col gap-3 max-w-[440px]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Nom de la marque</span>
            <input value={v.nom} onChange={(e) => set('nom')(e.target.value)} className={champ} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Site</span>
            <input
              value={v.site}
              onChange={(e) => set('site')(e.target.value)}
              placeholder="tamarque.fr"
              className={champ}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Secteur</span>
            <input
              value={v.secteur}
              onChange={(e) => set('secteur')(e.target.value)}
              placeholder="Beauté, mode, alimentaire…"
              className={champ}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Contact</span>
            <input
              value={v.contact}
              onChange={(e) => set('contact')(e.target.value)}
              placeholder="La personne qu'on appelle"
              className={champ}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Téléphone</span>
            <input
              value={v.telephone}
              onChange={(e) => set('telephone')(e.target.value)}
              placeholder="06 12 34 56 78"
              className={champ}
            />
          </label>

          {erreur && (
            <p className="text-sm text-red-ink bg-red-pale rounded-box px-3.5 py-2.5" role="alert">
              {erreur}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={etat === 'envoi'}
              className="inline-flex items-center gap-2 rounded-pill bg-ink text-paper px-5 py-2.5 text-base font-medium transition-colors hover:bg-ink/90 disabled:opacity-40"
            >
              {etat === 'envoi' ? <><Loader2 className="w-4 h-4 animate-spin" /> Un instant…</> : 'Enregistrer'}
            </button>
            {etat === 'fait' && (
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Check className="w-4 h-4" strokeWidth={2.2} /> Enregistré
              </span>
            )}
          </div>
        </form>

        {marque?.email && (
          <p className="mt-6 pt-5 border-t border-line text-sm text-ink-muted">
            Connecté avec <span className="font-medium text-ink">{marque.email}</span>. Pour changer
            d&apos;adresse, écris-nous : c&apos;est elle qui ouvre ton espace.
          </p>
        )}
      </Zone>
    </div>
  );
}
