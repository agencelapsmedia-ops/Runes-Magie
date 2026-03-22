/**
 * Utility functions for Runes & Magie
 */

/**
 * Merge class names, filtering out falsy values.
 * Lightweight alternative to clsx/classnames.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a price in Canadian French format.
 * Example: formatPrice(45) => "45,00 $"
 */
export function formatPrice(price: number): string {
  return (
    price
      .toFixed(2)
      .replace(".", ",") + " $"
  );
}

/**
 * Create a URL-friendly slug from a string.
 * Handles accented characters common in French.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // Remove non-alphanumeric chars
    .replace(/\s+/g, "-")            // Spaces to hyphens
    .replace(/-+/g, "-")             // Collapse multiple hyphens
    .replace(/^-|-$/g, "");          // Trim leading/trailing hyphens
}
