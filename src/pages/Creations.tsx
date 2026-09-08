import { useMemo, useState } from 'react';
import { useDonnees } from '../donnees';
import { Bouton, Entete, Statut, Vide, Zone } from '../ui/pieces';
import { Panneau, Texte } from '../ui/Panneau';
import { Creation, demanderRevision, validerCreation } from '../services/espaceClient';
import { compact, dateLongue, nombre } from '../lib';
import { Voir } from '../ui/Video';
import { Profils } from '../ui/Profils';

/**
 * Ce que les créateurs produisent pour la marque.
 *
 * Ce qui attend un retour est en haut et ne peut pas se manquer. En
 * dessous, ce qui a été diffusé et ce que ça a fait, puis les
 * personnes derrière.
 *
 * Chaque vidéo porte le prénom et le compte public de qui l'a tournée.
 * La marque paie ces créateurs : lui montrer un volume et des vidéos
 * anonymes revenait à lui cacher ce qu'elle achète, et un post publié
 * est public de toute façon. S'arrêtent au portail : l'email, le
 * téléphone, l'adresse, la commission. La transparence porte sur le
 * travail, pas sur le dossier.
 */
export function Creations() {
  const { creations, campagnes, createurs, profils, chargement, recharger } = useDonnees();
  const [aRevoir, setARevoir] = useState<Creation | null>(null);
  const [choisir, setChoisir] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const produitDe = useMemo(
    () => new Map(campagnes.map((c) => [c.id, c.produit])),
    [campagnes],
  );

  if (chargement) return <Vide>Chargement…</Vide>;

  const attente = creations.filter((c) => c.statut === 'a_valider');
  const aChoisir = profils.filter((p) => p.choix === null);
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
        sous="Chaque vidéo produite pour vous, et qui l'a faite."
      />

      {/* La sélection passe devant tout : elle bloque le départ d'une
          vague, et elle est la seule chose ici qui ait une échéance. */}
      {profils.length > 0 && (
        <Zone
          titre={aChoisir.length > 0 ? 'Des profils vous attendent' : 'Votre sélection'}
          compte={profils.length}
          action={
            <Bouton ton="accent" onClick={() => setChoisir(true)}>
              {aChoisir.length > 0 ? 'Voir les profils' : 'Revoir ma sélection'}
            </Bouton>
          }
        >
          <p className="px-5 py-5 text-md leading-relaxed">
            {aChoisir.length > 0 ? (
              <>
                On a présélectionné <strong>{profils.length} créateur{profils.length > 1 ? 's' : ''}</strong> pour
                la vague {profils[0].campagne}.{' '}
                {aChoisir.length === profils.length
                  ? 'Vous les voyez un par un, vous gardez ceux qui vous vont.'
                  : `Il vous en reste ${aChoisir.length} à trancher.`}
              </>
            ) : (
              <>
                Vos {profils.length} réponses sont enregistrées. Ouvrez la sélection pour l&apos;envoyer, ou
                pour changer d&apos;avis avant.
              </>
            )}
          </p>
        </Zone>
      )}

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
                  <Signature creation={c} />
                  <p className="text-sm text-ink-muted mt-1">
                    {produitDe.get(c.campagneId) ?? '—'}
                    <br />
                    {c.angle}
                  </p>
                  <p className="text-xs text-ink-faint mt-1">Déposée le {dateLongue(c.deposeLe)}</p>
                  <div className="mt-auto pt-4 flex flex-wrap items-center gap-3">
                    <Voir fichier={c.fichier} lien={c.lien} />
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
                  <Signature creation={c} />
                  {c.motif && <p className="text-sm text-red-ink mt-0.5">Reprise demandée : {c.motif}</p>}
                  <Voir fichier={c.fichier} lien={c.lien} />
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

      <Zone titre="Vos créateurs" compte={createurs.length}>
        {createurs.length === 0 ? (
          <Vide>Aucun créateur engagé pour l&apos;instant.</Vide>
        ) : (
          <ul className="divide-y divide-line">
            {createurs.map((cd) => (
              <li key={cd.id} className="px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="w-10 h-10 shrink-0 rounded-pill bg-inset border border-line grid place-items-center text-base font-bold text-ink-faint">
                  {cd.prenom.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium">{cd.prenom}</span>
                  <span className="block text-sm text-ink-muted">
                    {cd.compte ?? '—'}
                    {cd.abonnes && ` · ${cd.abonnes} abonnés`}
                    {cd.univers && ` · ${cd.univers}`}
                  </span>
                </span>
                <span className="text-right shrink-0 text-sm tabular-nums">
                  <span className="block">
                    {cd.videosPubliees} vidéo{cd.videosPubliees > 1 ? 's' : ''} en ligne
                  </span>
                  <span className="block text-ink-faint">
                    {nombre(cd.vues)} vue{cd.vues > 1 ? 's' : ''} · {cd.ventes} vente{cd.ventes > 1 ? 's' : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Zone>

      {choisir && profils.length > 0 && (
        <Profils profils={profils} onFermer={() => setChoisir(false)} onFait={recharger} />
      )}

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

/**
 * Qui a fait cette vidéo.
 *
 * Le prénom et le compte, rien de plus. Le compte est cliquable quand
 * la vidéo est en ligne : c'est le post public, la marque peut le
 * vérifier elle-même plutôt que nous croire sur parole.
 */
function Signature({ creation }: { creation: Creation }) {
  if (!creation.createur) return null;
  const nom = (
    <>
      <span className="font-medium text-ink">{creation.createur}</span>
      {creation.compte && <span className="text-ink-muted"> {creation.compte}</span>}
    </>
  );
  return (
    <p className="text-sm mt-1">
      {creation.lien ? (
        <a
          href={creation.lien}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 decoration-line-strong hover:decoration-ink transition-colors"
        >
          {nom}
        </a>
      ) : (
        nom
      )}
    </p>
  );
}
