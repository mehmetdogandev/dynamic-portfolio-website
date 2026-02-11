import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  roleTable,
  userRoleTable,
  roleGroupTable,
  userRoleGroupTable,
} from "@/lib/db/schemas";

export type Page =
  | "HOME_PAGE"
  | "USERS"
  | "ROLES"
  | "ROLE_GROUPS"
  | "SETTINGS";
export type Permission =
  | "CREATE"
  | "DELETE"
  | "UPDATE"
  | "ACCESS"
  | "READ";

/**
 * Returns a map of page -> set of permissions for the given user.
 * Aggregates from direct roles (user_role_table) and role groups (user_role_group_table -> role_group_table -> role_table).
 */
export async function getPermissions(
  userId: string
): Promise<Map<Page, Set<Permission>>> {
  const map = new Map<Page, Set<Permission>>();

  const addRole = (page: Page, permissions: Permission[]) => {
    let set = map.get(page);
    if (!set) {
      set = new Set<Permission>();
      map.set(page, set);
    }
    for (const p of permissions) {
      set.add(p);
    }
  };

  // Direct roles: user_role_table -> role_table
  const directUserRoles = await db
    .select({ roleId: userRoleTable.roleId })
    .from(userRoleTable)
    .where(eq(userRoleTable.userId, userId));

  if (directUserRoles.length > 0) {
    const roles = await db
      .select({ page: roleTable.page, permissions: roleTable.permissions })
      .from(roleTable)
      .where(
        inArray(
          roleTable.id,
          directUserRoles.map((r) => r.roleId)
        )
      );
    for (const r of roles) {
      addRole(r.page as Page, r.permissions as Permission[]);
    }
  }

  // Via role groups: user_role_group_table -> role_group_table -> role_table
  const userRoleGroups = await db
    .select({ roleGroupId: userRoleGroupTable.roleGroupId })
    .from(userRoleGroupTable)
    .where(eq(userRoleGroupTable.userId, userId));

  if (userRoleGroups.length > 0) {
    const groups = await db
      .select({ roleId: roleGroupTable.roleId })
      .from(roleGroupTable)
      .where(
        inArray(
          roleGroupTable.id,
          userRoleGroups.map((g) => g.roleGroupId)
        )
      );
    if (groups.length > 0) {
      const roles = await db
        .select({ page: roleTable.page, permissions: roleTable.permissions })
        .from(roleTable)
        .where(inArray(roleTable.id, groups.map((g) => g.roleId)));
      for (const r of roles) {
        addRole(r.page as Page, r.permissions as Permission[]);
      }
    }
  }

  return map;
}

/**
 * Returns whether the user has the given permission on the given page.
 */
export async function can(
  userId: string,
  page: Page,
  permission: Permission
): Promise<boolean> {
  const permissions = await getPermissions(userId);
  return permissions.get(page)?.has(permission) ?? false;
}

/**
 * Returns an object suitable for client: { [page]: boolean } for ACCESS only.
 * Used for sidebar visibility.
 */
export async function getMyPermissionsForAccess(
  userId: string
): Promise<Record<string, boolean>> {
  const permissions = await getPermissions(userId);
  const result: Record<string, boolean> = {};
  for (const [page, set] of permissions) {
    result[page] = set.has("ACCESS");
  }
  return result;
}

/**
 * Returns full permissions per page: { [page]: Permission[] }.
 * Used for button visibility (CREATE, READ, UPDATE, DELETE).
 */
export async function getMyPermissionsFull(
  userId: string
): Promise<Record<string, Permission[]>> {
  const permissions = await getPermissions(userId);
  const result: Record<string, Permission[]> = {};
  for (const [page, set] of permissions) {
    result[page] = Array.from(set);
  }
  return result;
}
