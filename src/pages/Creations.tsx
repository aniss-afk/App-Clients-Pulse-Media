import { useMemo, useState } from 'react';
import { useDonnees } from '../donnees';
import { Bouton, Entete, Statut, Vide, Zone } from '../ui/pieces';
import { Panneau, Texte } from '../ui/Panneau';
import { Creation, demanderRevision, validerCreation } from '../services/espaceClient';
import { compact, dateLongue } from '../lib';

/**
 * Les créations, à valider puis en ligne.
 *
 * Ce qui attend un retour est en haut et ne peut pas se manquer. Le
 * reste est un historique : ce qui a été diffusé, et ce que ça a fait.
 */
export function Creations() {
  const { creations, campagnes, chargement, recharger } = useDonnees();
  const [aRevoir, setARevoir] = useState<Creation | null>(null);
  const [enCours, setEnCours] = useState(false);

  const produitDe = useMemo(
    () => new Map(campagnes.map((c) => [c.id, c.produit])),
    [campagnes],
  );

  if (chargement) return <Vide>Chargement…</Vide>;

  const attente = creations.filter((c) => c.statut === 'a_valider');
  const suite = creations
    .filter((c) => c.statut !== 'a_valider')
    .sort((a, b) => (a.deposeLe < b.deposeLe ? 1 : -1));

  async function valider(id: string) {
    setEnCours(true);
    try {
      await validerCreation(id);
      await recharger();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Entete
        titre="Créations"
        sous="Chaque vidéo produite pour vous passe par ici avant d'être diffusée."
      />

      <Zone titre="À valider" compte={attente.length}>
        {attente.length === 0 ? (
          <Vide>Rien n&apos;attend votre retour.</Vide>
        ) : (
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {attente.map((c) => (
              <article key={c.id} className="bg-paper p-5 flex gap-5">
                {/* Une vignette verticale : les vidéos le sont, et un grand
                    cadre vide occuperait la page sans rien montrer. */}
                <div
                  className="w-[96px] shrink-0 aspect-[9/16] rounded-box border border-line flex items-end p-2"
                  style={{ backgroundColor: c.teinte }}
                >
                  <span className="text-[10px] font-semibold uppercase text-ink-muted">{c.duree}</span>
                </div>
                <div className="min-w-0 flex flex-col">
                  <h3 className="text-base font-medium">{c.titre}</h3>
                  <p className="text-sm text-ink-muted mt-1">
                    {produitDe.get(c.campagneId) ?? '—'}
                    <br />
                    {c.angle}
                  </p>
                  <p className="text-xs text-ink-faint mt-1">Déposée le {dateLongue(c.deposeLe)}</p>
                  <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                    <Bouton ton="accent" disabled={enCours} onClick={() => void valider(c.id)}>
                      Valider
                    </Bouton>
                    <Bouton onClick={() => setARevoir(c)}>Demander une reprise</Bouton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Zone>

      <Zone titre="La suite" compte={suite.length}>
        {suite.length === 0 ? (
          <Vide>Aucune création pour l&apos;instant.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {suite.map((c) => (
              <li key={c.id} className="px-5 py-4 flex items-center gap-5">
                <span
                  className="w-9 h-12 rounded-[6px] shrink-0 border border-line"
                  style={{ backgroundColor: c.teinte }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium truncate">{c.titre}</span>
                    <Statut valeur={c.statut} />
                  </div>
                  <p className="text-sm text-ink-muted truncate">
                    {produitDe.get(c.campagneId) ?? '—'} · {c.angle}
                  </p>
                  {c.motif && <p className="text-sm text-red-ink mt-0.5">Reprise demandée : {c.motif}</p>}
                </div>
                {c.statut === 'en_ligne' && (
                  <div className="text-right shrink-0 text-sm tabular-nums">
                    <div>{compact(c.vues)} vues</div>
                    <div className="text-ink-faint">
                      {c.ventes} vente{c.ventes > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Zone>

      {aRevoir && (
        <PanneauReprise
          creation={aRevoir}
          onFermer={() => setARevoir(null)}
          onFait={recharger}
        />
      )}
    </>
  );
}

function PanneauReprise({
  creation,
  onFermer,
  onFait,
}: {
  creation: Creation;
  onFermer: () => void;
  onFait: () => Promise<void>;
}) {
  const [motif, setMotif] = useState('');
  const [faute, setFaute] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function valider() {
    /* Sans motif, la vidéo revient à l'identique et on a perdu trois
       jours. C'est la seule contrainte de cet écran. */
    if (motif.trim().length < 5) {
      setFaute('Dites ce qui ne va pas, même en une ligne.');
      return;
    }
    setEnCours(true);
    try {
      await demanderRevision(creation.id, motif.trim());
      await onFait();
      onFermer();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Panneau
      titre="Demander une reprise"
      sous={creation.titre}
      ouvert
      onFermer={onFermer}
      onValider={valider}
      valider="Envoyer la demande"
      enCours={enCours}
    >
      <Texte
        label="Ce qui ne va pas"
        valeur={motif}
        onChange={(v) => {
          setMotif(v);
          setFaute('');
        }}
        lignes={5}
        placeholder="Le prix affiché à l'écran n'est plus le bon."
        faute={faute}
        aide="Transmis tel quel à l'équipe qui produit la vidéo."
      />
    </Panneau>
  );
}
