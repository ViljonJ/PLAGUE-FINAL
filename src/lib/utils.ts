import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatContent(content: string | undefined): string {
  if (!content) return '';
  // Fix cases where AI returns literal \n instead of newlines
  return content.replace(/\\n/g, '\n');
}
