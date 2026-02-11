/**
 * Database seed: creates users via Better Auth signUp and seeds RBAC roles + assignments.
 * Run: pnpm db:seed (from project root; .env with DATABASE_URL must be present).
 * Ensure tables exist first: pnpm db:push or pnpm db:migrate.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/better-auth/config";
import { db } from "@/lib/db";
import { roleTable, userRoleTable } from "@/lib/db/schemas";

const SEED_USERS = [
  { name: "Admin", email: "admin@example.com", password: "Admin123!", roleName: "Admin USERS" },
  { name: "Viewer", email: "viewer@example.com", password: "Viewer123!", roleName: "Viewer USERS" },
] as const;

async function seedUsers(): Promise<Map<string, string>> {
  const emailToUserId = new Map<string, string>();
  for (const u of SEED_USERS) {
    try {
      const result = await auth.api.signUpEmail({
        body: { name: u.name, email: u.email, password: u.password },
      });
      const userId = result?.user?.id;
      if (userId) {
        emailToUserId.set(u.email, userId);
        console.log("[seed] Created user:", u.email);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("unique")) {
        console.log("[seed] User already exists, skipping:", u.email);
        try {
          const existing = await db.query.user.findFirst({
            where: (users, { eq }) => eq(users.email, u.email),
            columns: { id: true },
          });
          if (existing) emailToUserId.set(u.email, existing.id);
        } catch {
          // Table may not exist or query failed
        }
      } else {
        console.error("[seed] Failed to create user", u.email, err);
      }
    }
  }
  return emailToUserId;
}

async function seedRoles(): Promise<Map<string, string>> {
  const roleNameToId = new Map<string, string>();

  const rolesToInsert = [
    {
      name: "Admin USERS",
      description: "Full access to Users page",
      page: "USERS" as const,
      permissions: ["ACCESS", "READ", "CREATE", "UPDATE", "DELETE"] as const,
    },
    {
      name: "Viewer USERS",
      description: "Read-only access to Users page",
      page: "USERS" as const,
      permissions: ["ACCESS", "READ"] as const,
    },
    {
      name: "Admin HOME",
      description: "Access to home page",
      page: "HOME_PAGE" as const,
      permissions: ["ACCESS"] as const,
    },
  ];

  for (const r of rolesToInsert) {
    const existing = await db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(eq(roleTable.name, r.name))
      .limit(1);
    if (existing.length > 0) {
      roleNameToId.set(r.name, existing[0]!.id);
      console.log("[seed] Role already exists:", r.name);
      continue;
    }
    const [inserted] = await db
      .insert(roleTable)
      .values({
        name: r.name,
        description: r.description,
        page: r.page,
        permissions: [...r.permissions],
      })
      .returning({ id: roleTable.id });
    if (inserted) {
      roleNameToId.set(r.name, inserted.id);
      console.log("[seed] Created role:", r.name);
    }
  }
  return roleNameToId;
}

async function seedUserRoles(
  emailToUserId: Map<string, string>,
  roleNameToId: Map<string, string>
): Promise<void> {
  for (const u of SEED_USERS) {
    const userId = emailToUserId.get(u.email);
    const roleId = roleNameToId.get(u.roleName);
    if (!userId || !roleId) continue;
    const existing = await db
      .select()
      .from(userRoleTable)
      .where(eq(userRoleTable.userId, userId));
    const alreadyAssigned = existing.some((r) => r.roleId === roleId);
    if (alreadyAssigned) {
      console.log("[seed] User already has role:", u.email, u.roleName);
      continue;
    }
    await db.insert(userRoleTable).values({ userId, roleId });
    console.log("[seed] Assigned role to user:", u.email, "->", u.roleName);
  }
}

async function main() {
  console.log("[seed] Starting...");
  const emailToUserId = await seedUsers();
  const roleNameToId = await seedRoles();
  await seedUserRoles(emailToUserId, roleNameToId);
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal:", err);
  process.exit(1);
});
