/**
 * Resolves avatar image URL from user.image field.
 * user.image can store: files table ID (uuid) or legacy full URL.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getAvatarUrl(
  image: string | null | undefined
): string | undefined {
  if (!image || typeof image !== "string") return undefined;
  if (UUID_REGEX.test(image)) {
    return `/api/files/${image}/view`;
  }
  return image;
}
