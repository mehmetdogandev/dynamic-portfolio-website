import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logo } from "@/lib/db/schemas";
import { eq, and } from "drizzle-orm";
import { getFileRecord, getFile } from "@/lib/minios3/utils";

function fallbackRedirect(request: Request): NextResponse {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;
  return NextResponse.redirect(new URL("/icon.svg", base));
}

export async function GET(request: Request) {
  try {
    const [activeFavicon] = await db
      .select({ fileId: logo.fileId })
      .from(logo)
      .where(and(eq(logo.status, "ACTIVE"), eq(logo.type, "WEBSITE_FAVICON")))
      .limit(1);

    if (!activeFavicon?.fileId) {
      return fallbackRedirect(request);
    }

    const record = await getFileRecord(activeFavicon.fileId);
    if (!record) {
      return fallbackRedirect(request);
    }

    const buffer = await getFile(record.fileName, record.bucket);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": record.mimeType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[logo/favicon]", error);
    return fallbackRedirect(request);
  }
}
