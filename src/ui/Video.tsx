import { useState } from 'react';
import { supabase } from '../auth/supabase';

/**
 * Voir la vidéo avant de trancher.
 *
 * Les fichiers vivent dans un bucket privé : le lien est signé au clic
 * et vit une heure, le temps de la regarder. Une fois en ligne, c'est
 * le post lui-même qu'on ouvre.
 */
export function Voir({ fichier, lien }: { fichier: string | null; lien: string | null }) {
  const [enCours, setEnCours] = useState(false);
  if (!fichier && !lien) return null;

  if (!fichier && lien) {
    return (
      <a href={lien} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors">
        Voir la publication
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={async () => {
        setEnCours(true);
        const { data } = await supabase.storage.from('videos').createSignedUrl(fichier!, 3600);
        if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
        setEnCours(false);
      }}
      className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors"
    >
      {enCours ? 'Ouverture…' : 'Voir la vidéo'}
    </button>
  );
}
