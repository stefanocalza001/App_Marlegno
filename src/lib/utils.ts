/**
 * @file src/lib/utils.ts
 * @description Funzioni di utilità trasversali per la composizione dinamica delle classi CSS in "App Marlegno".
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina condizionalmente più classi CSS risolvendo automaticamente i conflitti di utilità Tailwind CSS.
 *
 * @param inputs - Elenco di stringhe, oggetti o array di classi CSS condizionali.
 * @returns Stringa di classi CSS unificata e deduplicata.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
