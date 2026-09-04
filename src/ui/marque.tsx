import { ReactNode } from 'react';
import { cn } from '../lib';

/**
 * Les gestes de marque.
 *
 * Ce sont eux qui font reconnaître Pulse Media, plus que la palette :
 * un aplat rouge posé de travers derrière un mot, un trait de marqueur
 * sous un titre. Sans eux on obtient les bonnes couleurs et une
 * interface qui ne ressemble à rien.
 */

export function Surligne({
  children,
  className,
  epais = false,
}: {
  children: ReactNode;
  className?: string;
  epais?: boolean;
}) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span
        className={cn(
          'absolute bg-red -rotate-[0.7deg]',
          epais ? 'inset-x-[-10px] inset-y-[4px]' : 'inset-x-[-6px] inset-y-[2px]',
        )}
        aria-hidden="true"
      />
      <span className="relative text-ink">{children}</span>
    </span>
  );
}

/** Trait de marqueur sous un titre de zone. */
export function Trait({ className }: { className?: string }) {
  return (
    <span
      className={cn('block h-[5px] w-9 bg-red -rotate-[0.8deg]', className)}
      aria-hidden="true"
    />
  );
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
