import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectDiscussions, project } from "@/lib/db/schemas";
import { sendDiscussionNotifyAdmin } from "@/lib/email/send-discussion-notify-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token?.trim()) {
    return NextResponse.redirect(
      new URL("/projeler?error=invalid_token", request.url)
    );
  }

  const [discussion] = await db
    .select()
    .from(projectDiscussions)
    .where(
      and(
        eq(projectDiscussions.verificationToken, token),
        gt(projectDiscussions.verificationTokenExpiresAt, new Date())
      )
    )
    .limit(1);

  if (!discussion) {
    return NextResponse.redirect(
      new URL("/projeler?error=expired_or_invalid", request.url)
    );
  }

  await db
    .update(projectDiscussions)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(projectDiscussions.id, discussion.id));

  const [projectRow] = await db
    .select({ name: project.name, slug: project.slug })
    .from(project)
    .where(eq(project.id, discussion.projectId))
    .limit(1);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const adminPanelUrl = `${baseUrl}/admin-panel/projects/${discussion.projectId}`;

  if (projectRow) {
    await sendDiscussionNotifyAdmin({
      projectName: projectRow.name,
      projectSlug: projectRow.slug,
      username: discussion.username,
      message: discussion.message,
      adminPanelUrl,
    });
  }

  const redirectUrl = projectRow
    ? `/projeler/${projectRow.slug}?verified=1`
    : "/projeler?verified=1";

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
