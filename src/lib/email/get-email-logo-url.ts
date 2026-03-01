import { db } from "@/lib/db";
import { logo } from "@/lib/db/schemas";
import { eq, and } from "drizzle-orm";

function getBaseUrl(): string {
  const url = process.env.BETTER_AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * Fetches the active EMAIL_LOGO from the database and returns its public absolute URL.
 * Returns null if no active EMAIL_LOGO exists.
 */
export async function getActiveEmailLogoUrl(): Promise<string | null> {
  const [row] = await db
    .select({ fileId: logo.fileId })
    .from(logo)
    .where(and(eq(logo.status, "ACTIVE"), eq(logo.type, "EMAIL_LOGO")))
    .limit(1);

  if (!row?.fileId) return null;

  const base = getBaseUrl();
  return `${base}/api/files/${row.fileId}/view`;
}
