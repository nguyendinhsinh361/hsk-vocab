import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp class có điều kiện + merge xung đột Tailwind (vd px-2 + px-4 → px-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
