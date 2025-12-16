import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Masks an email address for privacy (e.g., jo***@example.com)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "***";
  
  const localPart = email.substring(0, atIndex);
  const domainPart = email.substring(atIndex);
  
  const maskedLocal = localPart.length <= 2 
    ? localPart + "***" 
    : localPart.substring(0, 2) + "***";
  
  return maskedLocal + domainPart;
}
