import { forwardRef, type ReactNode } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

// Tracés du QG agence : ui/Icones.tsx et acces/icones.tsx.
function icone(nom: string, trace: ReactNode): LucideIcon {
  const I = forwardRef<SVGSVGElement, LucideProps>(function Icone(
    {
      size = 24,
      strokeWidth = 1.7,
      className,
      color = 'currentColor',
      absoluteStrokeWidth: _a,
      children: _c,
      ...reste
    },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...reste}
      >
        {trace}
      </svg>
    );
  });
  I.displayName = nom;
  return I as unknown as LucideIcon;
}

export const IcGrille = icone(
  'IcGrille',
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </>,
);
export const IcVideo = icone(
  'IcVideo',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M10 9.5v5l4.5-2.5z" />
  </>,
);
export const IcCalendrier = icone(
  'IcCalendrier',
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </>,
);
export const IcCoche = icone('IcCoche', <path d="M5 12.5l4.5 4.5L19 7" />);
export const IcCroix = icone('IcCroix', <path d="M6 6l12 12M18 6L6 18" />);
