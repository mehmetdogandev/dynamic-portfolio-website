/**
 * Turkish character transliteration map
 */
const TR_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

/**
 * Converts a string to a URL-friendly slug.
 * Transliterates Turkish characters and removes diacritics.
 */
export function slugify(text: string): string {
  if (!text?.trim()) return "";

  let slug = text
    .trim()
    .split("")
    .map((c) => TR_CHAR_MAP[c] ?? c)
    .join("");

  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}
