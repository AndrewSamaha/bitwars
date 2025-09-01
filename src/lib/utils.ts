import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeString(inputString: string): string {
  // 1. Replace special characters with spaces
  let cleanedString = inputString.toLowerCase().trim().replace(/[^a-zA-Z0-9\s]/g, ' ');

  // 2. Replace consecutive spaces with a single space
  cleanedString = cleanedString.replace(/\s+/g, ' ');

  // 3. Trim leading/trailing spaces
  cleanedString = cleanedString.trim();

  return cleanedString;
}
