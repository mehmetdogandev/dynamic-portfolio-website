/**
 * Database seed: creates users via Better Auth signUp and seeds RBAC roles,
 * role groups (role_group_role_table), and assignments.
 * Run: pnpm db:seed (from project root; .env with DATABASE_URL must be present).
 * Ensure tables exist first: pnpm db:push or pnpm db:migrate.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/better-auth/config";
import { db } from "@/lib/db";
import {
  roleTable,
  roleGroupTable,
  roleGroupRoleTable,
  userRoleTable,
  userRoleGroupTable,
  userInfo as userInfoTable,
} from "@/lib/db/schemas";

const PAGES = [
  "HOME_PAGE",
  "USERS",
  "ROLES",
  "ROLE_GROUPS",
  "USER_ROLES",
  "USER_ROLE_GROUPS",
  "LOGO",
  "POST",
] as const;

const FULL_PERMISSIONS = ["CREATE", "READ", "UPDATE", "DELETE", "ACCESS"] as const;

const SEED_USERS = [
  { name: "Admin", email: "admin@example.com", password: "Admin123!", roleName: "Admin USERS" },
  { name: "Viewer", email: "viewer@example.com", password: "Viewer123!", roleName: "Viewer USERS" },
  { name: "Mehmet Doğan", email: "mehmet.dogan@gmail.com", password: "Admin123!", roleGroupName: "ADMIN" },
] as const;

async function ensureUser(
  name: string,
  email: string,
  password: string
): Promise<string | null> {
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });
    const userId = result?.user?.id;
    if (userId) {
      console.log("[seed] Created user:", email);
      return userId;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("unique")) {
      console.log("[seed] User already exists, skipping:", email);
      try {
        const existing = await db.query.user.findFirst({
          where: (users, { eq }) => eq(users.email, email),
          columns: { id: true },
        });
        if (existing) return existing.id;
      } catch {
        // ignore
      }
    } else {
      console.error("[seed] Failed to create user", email, err);
    }
  }
  return null;
}

async function seedUsers(): Promise<Map<string, string>> {
  const emailToUserId = new Map<string, string>();
  for (const u of SEED_USERS) {
    const userId = await ensureUser(u.name, u.email, u.password);
    if (userId) emailToUserId.set(u.email, userId);
  }
  return emailToUserId;
}

async function seedRoles(): Promise<Map<string, string>> {
  const roleNameToId = new Map<string, string>();

  // Her page için ADMIN rolü (tüm yetkiler)
  for (const page of PAGES) {
    const name = `${page}_ADMIN_ROLE`;
    const existing = await db
      .select({ id: roleTable.id })
      .from(roleTable)
      .where(eq(roleTable.name, name))
      .limit(1);
    if (existing.length > 0) {
      roleNameToId.set(name, existing[0]!.id);
      console.log("[seed] Role already exists:", name);
      continue;
    }
    const [inserted] = await db
      .insert(roleTable)
      .values({
        name,
        description: `Full access to ${page}`,
        page,
        permissions: [...FULL_PERMISSIONS],
      })
      .returning({ id: roleTable.id });
    if (inserted) {
      roleNameToId.set(name, inserted.id);
      console.log("[seed] Created role:", name);
    }
  }

  // Eski roller (admin@example.com, viewer@example.com için)
  const legacyRoles = [
    { name: "Admin USERS", description: "Full access to Users page", page: "USERS" as const, permissions: [...FULL_PERMISSIONS] },
    { name: "Viewer USERS", description: "Read-only access to Users page", page: "USERS" as const, permissions: ["ACCESS", "READ"] as const },
    { name: "Admin HOME", description: "Access to home page", page: "HOME_PAGE" as const, permissions: ["ACCESS"] as const },
  ];
  for (const r of legacyRoles) {
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

async function seedRoleGroups(roleNameToId: Map<string, string>): Promise<string | null> {
  // ADMIN rol grubu (tek grup)
  const existingGroup = await db
    .select({ id: roleGroupTable.id })
    .from(roleGroupTable)
    .where(eq(roleGroupTable.name, "ADMIN"))
    .limit(1);
  let adminGroupId: string;
  if (existingGroup.length > 0) {
    adminGroupId = existingGroup[0]!.id;
    console.log("[seed] Role group already exists: ADMIN");
  } else {
    const [inserted] = await db
      .insert(roleGroupTable)
      .values({
        name: "ADMIN",
        description: "Full admin role group for all pages",
      })
      .returning({ id: roleGroupTable.id });
    if (!inserted) return null;
    adminGroupId = inserted.id;
    console.log("[seed] Created role group: ADMIN");
  }

  // Aynı role_group_id ile her page admin rolünü role_group_role_table'a ekle
  const existingLinks = await db
    .select({ roleId: roleGroupRoleTable.roleId })
    .from(roleGroupRoleTable)
    .where(eq(roleGroupRoleTable.roleGroupId, adminGroupId));
  const linkedRoleIds = new Set(existingLinks.map((l) => l.roleId));

  for (const page of PAGES) {
    const roleName = `${page}_ADMIN_ROLE`;
    const roleId = roleNameToId.get(roleName);
    if (!roleId) continue;
    if (linkedRoleIds.has(roleId)) {
      console.log("[seed] Role already in group:", roleName);
      continue;
    }
    await db.insert(roleGroupRoleTable).values({ roleGroupId: adminGroupId, roleId });
    linkedRoleIds.add(roleId);
    console.log("[seed] Linked role to ADMIN group:", roleName);
  }

  return adminGroupId;
}

async function seedUserRoleGroups(
  emailToUserId: Map<string, string>,
  adminGroupId: string | null
): Promise<void> {
  if (!adminGroupId) return;
  const adminEmail = "mehmet.dogan@gmail.com";
  const userId = emailToUserId.get(adminEmail);
  if (!userId) return;
  const existing = await db
    .select()
    .from(userRoleGroupTable)
    .where(eq(userRoleGroupTable.userId, userId));
  const alreadyAssigned = existing.some((r) => r.roleGroupId === adminGroupId);
  if (alreadyAssigned) {
    console.log("[seed] User already has role group:", adminEmail, "-> ADMIN");
    return;
  }
  await db.insert(userRoleGroupTable).values({ userId, roleGroupId: adminGroupId });
  console.log("[seed] Assigned role group to user:", adminEmail, "-> ADMIN");
}

async function seedUserInfo(emailToUserId: Map<string, string>): Promise<void> {
  const adminEmail = "mehmet.dogan@gmail.com";
  const userId = emailToUserId.get(adminEmail);
  if (!userId) return;
  const existing = await db
    .select({ id: userInfoTable.id })
    .from(userInfoTable)
    .where(eq(userInfoTable.userId, userId))
    .limit(1);
  if (existing.length > 0) {
    console.log("[seed] User info already exists:", adminEmail);
    return;
  }
  await db.insert(userInfoTable).values({
    userId,
    lastName: "Doğan",
    displayName: "Mehmet Doğan",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    profilePicture: null,
    bio: null,
    website: null,
    twitter: null,
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
    tiktok: null,
    pinterest: null,
    reddit: null,
    telegram: null,
    whatsapp: null,
    viber: null,
    skype: null,
    discord: null,
    twitch: null,
    spotify: null,
    appleMusic: null,
    amazonMusic: null,
    deezer: null,
    soundcloud: null,
  });
  console.log("[seed] Created user info for:", adminEmail);
}

async function seedUserRoles(
  emailToUserId: Map<string, string>,
  roleNameToId: Map<string, string>
): Promise<void> {
  for (const u of SEED_USERS) {
    const roleName = "roleName" in u ? u.roleName : null;
    if (!roleName) continue; // mehmet.dogan@gmail.com has roleGroupName only
    const userId = emailToUserId.get(u.email);
    const roleId = roleNameToId.get(roleName);
    if (!userId || !roleId) continue;
    const existing = await db
      .select()
      .from(userRoleTable)
      .where(eq(userRoleTable.userId, userId));
    const alreadyAssigned = existing.some((r) => r.roleId === roleId);
    if (alreadyAssigned) {
      console.log("[seed] User already has role:", u.email, roleName);
      continue;
    }
    await db.insert(userRoleTable).values({ userId, roleId });
    console.log("[seed] Assigned role to user:", u.email, "->", roleName);
  }
}

async function main() {
  console.log("[seed] Starting...");
  const emailToUserId = await seedUsers();
  const roleNameToId = await seedRoles();
  const adminGroupId = await seedRoleGroups(roleNameToId);
  await seedUserRoleGroups(emailToUserId, adminGroupId);
  await seedUserRoles(emailToUserId, roleNameToId);
  await seedUserInfo(emailToUserId);
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal:", err);
  process.exit(1);
});
