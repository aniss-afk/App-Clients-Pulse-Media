import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind en laissant la dernière gagner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const euro = (n: number) =>
  n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });

export const nombre = (n: number) => n.toLocaleString('fr-FR');

export const compact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')} k`;
  return String(n);
};

export const dateCourte = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

export const dateLongue = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export const mois = (m: string) =>
  new Date(`${m}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export const ratio = (n: number | null, decimales = 1) =>
  n === null ? '—' : `${n.toFixed(decimales).replace('.', ',')}×`;
