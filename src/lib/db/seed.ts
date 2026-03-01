/**
 * Database seed: creates users via Better Auth signUp and seeds RBAC roles,
 * role groups (role_group_role_table), and assignments.
 * Run: pnpm db:seed (from project root; .env with DATABASE_URL must be present).
 * Ensure tables exist first: pnpm db:push or pnpm db:migrate.
 * Projects seed requires MinIO/S3 to be configured.
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
  user,
  projectCategory,
  project,
} from "@/lib/db/schemas";
import { closeDb } from "@/lib/db";
import { uploadFile } from "@/lib/minios3/utils";

const SEED_PROJECTS = [
  { slug: "sales-marketing-bot", title: "Sales Marketing Bot", description: "GetCody API kullanarak veri odaklı müşteri etkileşimlerini destekleyen satış ve pazarlama botu geliştirildi.", longDescription: "Kuzeyboru A.Ş. için GetCody API kullanarak satış ve pazarlama süreçlerini otomatize eden bir bot geliştirdim. Sistem canlı olarak kullanılmaktadır ve veri odaklı müşteri etkileşimlerini desteklemektedir.", images: ["https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80"], imageAlt: "Sales Marketing Bot", featured: true },
  { slug: "exam-system", title: "Sınav Sistemi", description: "Yazılım ve mühendislik dersleri için güvenli değerlendirmeleri destekleyen bilgisayar tabanlı sınav sistemi.", longDescription: "MDKARE ~ SOFT için yazılım ve mühendislik derslerinde güvenli değerlendirmeleri destekleyecek şekilde tasarlanmış bilgisayar tabanlı bir sınav sistemi geliştirdim. Sistem online olarak kullanılmaktadır.", images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"], imageAlt: "Exam System", featured: true },
  { slug: "real-estate-website", title: "Emlak ve İnşaat Web Sitesi", description: "Emlak ve müteahhit platformu için web sitesi tasarımı ve geliştirmesi.", longDescription: "MDKARE ~ SOFT için emlak ve müteahhit web platformu tasarlayıp geliştirdim. Detaylı proje dokümantasyonu GitHub üzerinde mevcuttur.", images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"], imageAlt: "Real Estate Website", featured: false },
  { slug: "personalized-qr-code-system", title: "Kişiselleştirilmiş QR Kod Sistemi", description: "Çalışanlar için kişiselleştirilmiş sayfalar ve tarama analitiği üreten QR kod sistemi.", longDescription: "Anadolu Mikronize A.Ş. için çalışan QR kodu sistemi geliştirdim. Her çalışan için kişiselleştirilmiş sayfalar oluşturulur ve tarama verileri analiz edilir.", images: ["https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80"], imageAlt: "QR Code System", featured: true },
  { slug: "personnel-entry-exit-system", title: "Personel Giriş-Çıkış Sistemi", description: "ESP32 ve RFID cihazları kullanan, Next.js API ile iletişim kuran IoT tabanlı personel giriş-çıkış sistemi.", longDescription: "Anadolu Mikronize A.Ş. için ESP32 ve RFID cihazları kullanan IoT tabanlı personel giriş-çıkış sistemi geliştirdim. Gerçek zamanlı devam verileri Next.js tabanlı API üzerinden iletilir ve şirket veritabanında güvenli şekilde saklanır.", images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80"], imageAlt: "IoT Personnel System", featured: false },
  { slug: "erp-system", title: "Kurumsal Kaynak Planlaması (ERP)", description: "İnsan kaynakları ve dahili operasyonel süreçleri dijitalleştiren ERP sistemi.", longDescription: "Anadolu Mikronize A.Ş. için insan kaynakları ve dahili operasyonel süreçleri dijitalleştiren bir ERP sistemi geliştirdim. İş verilerini merkezileştirerek süreç kontrolü ve veri tutarlılığını artırdım.", images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"], imageAlt: "ERP System", featured: true },
  { slug: "building-management-system", title: "Bina Yönetim Sistemi", description: "Canlı demo erişimli bina yönetim sistemi tasarımı ve geliştirmesi.", longDescription: "MDKARE ~ SOFT için bina yönetim sistemi tasarlayıp geliştirdim. Kullanım dokümantasyonu, canlı demo erişimi ve genel sistem özeti mevcuttur.", images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80"], imageAlt: "Building Management System", featured: false },
  { slug: "mirello", title: "MIRELLO", description: "Trello platformunu referans alan, eşdeğer temel özellikler sunan full-stack proje yönetim uygulaması.", longDescription: "Trello platformunu referans alarak MIRELLO adlı full-stack proje yönetim uygulaması geliştirdim. Eşdeğer temel özellikler sunar. Kaynak kodu ve tam proje dokümantasyonu GitHub'da mevcuttur.", images: ["https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80"], imageAlt: "MIRELLO Project Management", featured: false },
  { slug: "consultant-performance-tracking", title: "Danışman Performans Takip Sistemi", description: "Softanalytic danışmanlık firması için günlük görev ve performans verilerini takip eden merkezi sistem.", longDescription: "Softanalytic danışmanlık firması için danışmanların günlük görevlerini ve performans verilerini takip eden merkezi bir sistem geliştirdim. Manuel raporlamayı azalttım ve yönetim ekiplerine ölçülebilir, veri odaklı karar desteği sağladım.", images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"], imageAlt: "Consultant Performance Tracking", featured: false },
  { slug: "core-banking-system", title: "Çekirdek Bankacılık Yönetim Sistemi", description: "Hesap yönetimi, para transferi ve işlem takibini simüle eden uçtan uca bankacılık uygulaması.", longDescription: "MDKARE ~ SOFT için çekirdek mali operasyonları simüle eden uçtan uca bir bankacılık uygulaması geliştiriyorum. Hesap yönetimi, para transferleri ve işlem takibi içerir.", images: ["https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1200&q=80"], imageAlt: "Core Banking System", featured: false },
] as const;

const PAGES = [
  "HOME_PAGE",
  "USERS",
  "ROLES",
  "ROLE_GROUPS",
  "USER_ROLES",
  "USER_ROLE_GROUPS",
  "LOGO",
  "POST",
  "PROJECT_CATEGORY",
  "PROJECT",
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
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId));
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
        if (existing) {
          await db.update(user).set({ emailVerified: true }).where(eq(user.id, existing.id));
          return existing.id;
        }
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

async function seedProjects(emailToUserId: Map<string, string>): Promise<void> {
  const adminEmail = "mehmet.dogan@gmail.com";
  const userId = emailToUserId.get(adminEmail);
  if (!userId) {
    console.log("[seed] Skipping projects: admin user not found");
    return;
  }

  let categoryId: string;
  const existingCat = await db
    .select({ id: projectCategory.id })
    .from(projectCategory)
    .where(eq(projectCategory.name, "Genel"))
    .limit(1);
  if (existingCat.length > 0) {
    categoryId = existingCat[0]!.id;
    console.log("[seed] Project category Genel already exists");
  } else {
    const [inserted] = await db
      .insert(projectCategory)
      .values({ name: "Genel", description: "Genel projeler" })
      .returning({ id: projectCategory.id });
    if (!inserted) return;
    categoryId = inserted.id;
    console.log("[seed] Created project category: Genel");
  }

  let placeholderFileId: string;
  try {
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const buffer = Buffer.from(pngBase64, "base64");
    const result = await uploadFile(buffer, "seed-placeholder.png", "image/png", {
      prefix: "projects",
      uploadedBy: userId,
      isPublic: true,
    });
    placeholderFileId = result.fileId;
  } catch (err) {
    console.warn("[seed] MinIO upload failed, skipping projects:", err instanceof Error ? err.message : err);
    return;
  }

  for (let i = 0; i < SEED_PROJECTS.length; i++) {
    const p = SEED_PROJECTS[i]!;
    const existing = await db
      .select({ id: project.id })
      .from(project)
      .where(eq(project.slug, p.slug))
      .limit(1);
    if (existing.length > 0) {
      console.log("[seed] Project already exists:", p.slug);
      continue;
    }
    const firstImg = p.images[0];
    const content = firstImg
      ? `<p>${escapeHtml(p.longDescription)}</p><p><img src="${escapeHtml(firstImg)}" alt="${escapeHtml(p.imageAlt)}" /></p>`
      : `<p>${escapeHtml(p.longDescription)}</p>`;
    await db.insert(project).values({
      name: p.title,
      slug: p.slug,
      shortDescription: p.description,
      userId,
      imageId: placeholderFileId,
      content,
      categoryId,
      isPublished: p.featured ?? false,
      order: i,
    });
    console.log("[seed] Created project:", p.slug);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function main() {
  console.log("[seed] Starting...");
  const emailToUserId = await seedUsers();
  const roleNameToId = await seedRoles();
  const adminGroupId = await seedRoleGroups(roleNameToId);
  await seedUserRoleGroups(emailToUserId, adminGroupId);
  await seedUserRoles(emailToUserId, roleNameToId);
  await seedUserInfo(emailToUserId);
  await seedProjects(emailToUserId);
  console.log("[seed] Done.");
  await closeDb();
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("[seed] Fatal:", err);
    try {
      await closeDb();
    } catch {
      // ignore
    }
    process.exit(1);
  });
