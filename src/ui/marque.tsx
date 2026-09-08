import { ReactNode } from 'react';
import { cn } from '../lib';

/**
 * Le mot qui porte la marque, en rouge.
 *
 * C'était un aplat rouge posé derrière le texte, débordant et penché,
 * doublé d'un trait de marqueur sous les titres. L'aplat mordait sur
 * les mots voisins et le trait faisait un second signe là où le titre
 * suffisait. La couleur seule distingue le mot sans le découper de sa
 * phrase, et elle tient à toutes les tailles.
 *
 * Le rouge d'encre est le seul lisible en petit corps sur le crème :
 * l'aplat reste pour les pastilles et les gros chiffres.
 */
export function Surligne({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-red-ink', className)}>{children}</span>;
}

/** Grande surface arrondie, filet très léger, ombre à peine perceptible. */
export function Carte({
  children,
  className,
  plat = false,
}: {
  children: ReactNode;
  className?: string;
  /** Sans remplissage interne, pour un tableau qui va jusqu'aux bords. */
  plat?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-card bg-paper border border-line shadow-card',
        plat ? '' : 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
