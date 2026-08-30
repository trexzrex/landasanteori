import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for conditional class names with Tailwind-aware merging.
 * Prevents conflicting utilities (e.g., "p-4 p-2") from stacking.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
