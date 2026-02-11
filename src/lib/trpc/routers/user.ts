import { z } from "zod";
import { eq, count, asc, desc, and, ilike } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { user as userTable, userInfo as userInfoTable } from "@/lib/db/schemas";
import { listInputSchema, type ListOutput } from "@/lib/trpc/list-schema";
import { uploadFile, getFileRecord, deleteFile } from "@/lib/minios3/utils";

const ALLOWED_SORT_COLUMNS = ["name", "email", "createdAt"] as const;
const ALLOWED_FILTER_COLUMNS = ["name", "email"] as const;

export const userRouter = createTRPCRouter({
  list: createPermissionProcedure("USERS", "READ")
    .input(listInputSchema)
    .query(async ({ ctx, input }): Promise<ListOutput<typeof userTable.$inferSelect>> => {
      const { page, limit, sortBy, sortOrder, columnFilters } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (columnFilters) {
        for (const [key, value] of Object.entries(columnFilters)) {
          if (ALLOWED_FILTER_COLUMNS.includes(key as typeof ALLOWED_FILTER_COLUMNS[number]) && value.trim()) {
            if (key === "name") {
              conditions.push(ilike(userTable.name, `%${value}%`));
            } else if (key === "email") {
              conditions.push(ilike(userTable.email, `%${value}%`));
            }
          }
        }
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(userTable)
        .where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      // Build order by
      let orderByClause;
      if (sortBy && ALLOWED_SORT_COLUMNS.includes(sortBy as typeof ALLOWED_SORT_COLUMNS[number])) {
        if (sortBy === "name") {
          orderByClause = sortOrder === "desc" ? desc(userTable.name) : asc(userTable.name);
        } else if (sortBy === "email") {
          orderByClause = sortOrder === "desc" ? desc(userTable.email) : asc(userTable.email);
        } else if (sortBy === "createdAt") {
          orderByClause = sortOrder === "desc" ? desc(userTable.createdAt) : asc(userTable.createdAt);
        }
      }
      // Default order by createdAt desc if no sort specified
      if (!orderByClause) {
        orderByClause = desc(userTable.createdAt);
      }

      // Get paginated items
      const items = await ctx.db
        .select()
        .from(userTable)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        totalPages,
      };
    }),

  getById: createPermissionProcedure("USERS", "READ")
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(userTable)
        .where(eq(userTable.id, input.id))
        .limit(1);
      const user = rows[0] ?? null;
      if (!user) return null;
      const [info] = await ctx.db
        .select()
        .from(userInfoTable)
        .where(eq(userInfoTable.userId, input.id))
        .limit(1);
      return { ...user, userInfo: info ?? null };
    }),

  create: createPermissionProcedure("USERS", "CREATE")
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(1).optional(),
        profilePhotoBase64: z.string().optional(),
        profilePhotoMimeType: z.string().optional(),
        profilePictureUrl: z.string().optional(),
        userInfo: z
          .object({
            lastName: z.string().optional(),
            displayName: z.string().optional(),
            phoneNumber: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
            bio: z.string().optional(),
            website: z.string().optional(),
            twitter: z.string().optional(),
            facebook: z.string().optional(),
            instagram: z.string().optional(),
            linkedin: z.string().optional(),
            youtube: z.string().optional(),
            tiktok: z.string().optional(),
            pinterest: z.string().optional(),
            reddit: z.string().optional(),
            telegram: z.string().optional(),
            whatsapp: z.string().optional(),
            viber: z.string().optional(),
            skype: z.string().optional(),
            discord: z.string().optional(),
            twitch: z.string().optional(),
            spotify: z.string().optional(),
            appleMusic: z.string().optional(),
            amazonMusic: z.string().optional(),
            deezer: z.string().optional(),
            soundcloud: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(userTable).values({
        id,
        name: input.name,
        email: input.email,
        emailVerified: false,
      });

      let profilePictureUrl: string | null = input.profilePictureUrl ?? null;
      if (!profilePictureUrl && input.profilePhotoBase64 && input.profilePhotoMimeType) {
        const base64 = input.profilePhotoBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const ext = input.profilePhotoMimeType.includes("png")
          ? ".png"
          : input.profilePhotoMimeType.includes("webp")
            ? ".webp"
            : ".jpg";
        const result = await uploadFile(buffer, `photo${ext}`, input.profilePhotoMimeType, {
          prefix: `profilePhoto/${id}`,
          uploadedBy: id,
        });
        profilePictureUrl = `/api/files/${result.id}/view`;
      }

      const u = input.userInfo;
      await ctx.db.insert(userInfoTable).values({
        userId: id,
        lastName: u?.lastName ?? "",
        displayName: u?.displayName ?? input.name,
        phoneNumber: u?.phoneNumber ?? "",
        address: u?.address ?? "",
        city: u?.city ?? "",
        state: u?.state ?? "",
        zipCode: u?.zipCode ?? "",
        country: u?.country ?? "",
        profilePicture: profilePictureUrl,
        bio: u?.bio ?? "",
        website: u?.website ?? "",
        twitter: u?.twitter ?? "",
        facebook: u?.facebook ?? "",
        instagram: u?.instagram ?? "",
        linkedin: u?.linkedin ?? "",
        youtube: u?.youtube ?? "",
        tiktok: u?.tiktok ?? "",
        pinterest: u?.pinterest ?? "",
        reddit: u?.reddit ?? "",
        telegram: u?.telegram ?? "",
        whatsapp: u?.whatsapp ?? "",
        viber: u?.viber ?? "",
        skype: u?.skype ?? "",
        discord: u?.discord ?? "",
        twitch: u?.twitch ?? "",
        spotify: u?.spotify ?? "",
        appleMusic: u?.appleMusic ?? "",
        amazonMusic: u?.amazonMusic ?? "",
        deezer: u?.deezer ?? "",
        soundcloud: u?.soundcloud ?? "",
      });
      return { id };
    }),

  update: createPermissionProcedure("USERS", "UPDATE")
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        profilePhotoBase64: z.string().optional(),
        profilePhotoMimeType: z.string().optional(),
        profilePictureUrl: z.string().optional(),
        userInfo: z
          .object({
            lastName: z.string().optional(),
            displayName: z.string().optional(),
            phoneNumber: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
            bio: z.string().optional(),
            website: z.string().optional(),
            twitter: z.string().optional(),
            facebook: z.string().optional(),
            instagram: z.string().optional(),
            linkedin: z.string().optional(),
            youtube: z.string().optional(),
            tiktok: z.string().optional(),
            pinterest: z.string().optional(),
            reddit: z.string().optional(),
            telegram: z.string().optional(),
            whatsapp: z.string().optional(),
            viber: z.string().optional(),
            skype: z.string().optional(),
            discord: z.string().optional(),
            twitch: z.string().optional(),
            spotify: z.string().optional(),
            appleMusic: z.string().optional(),
            amazonMusic: z.string().optional(),
            deezer: z.string().optional(),
            soundcloud: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        profilePhotoBase64,
        profilePhotoMimeType,
        profilePictureUrl: inputProfilePictureUrl,
        userInfo: u,
        ...userRest
      } = input;
      await ctx.db
        .update(userTable)
        .set({ ...userRest, updatedAt: new Date() })
        .where(eq(userTable.id, id));

      const [existingInfo] = await ctx.db
        .select()
        .from(userInfoTable)
        .where(eq(userInfoTable.userId, id))
        .limit(1);

      let profilePictureUrl: string | null =
        inputProfilePictureUrl ?? existingInfo?.profilePicture ?? null;
      if (!profilePictureUrl && profilePhotoBase64 && profilePhotoMimeType) {
        if (existingInfo?.profilePicture) {
          const match = existingInfo.profilePicture.match(/\/api\/files\/([^/]+)\/view/);
          if (match?.[1]) {
            try {
              const rec = await getFileRecord(match[1]);
              if (rec) await deleteFile(rec.fileName, rec.bucket);
            } catch {
              // ignore
            }
          }
        }
        const base64 = profilePhotoBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const ext = profilePhotoMimeType.includes("png") ? ".png" : profilePhotoMimeType.includes("webp") ? ".webp" : ".jpg";
        const result = await uploadFile(buffer, `photo${ext}`, profilePhotoMimeType, {
          prefix: `profilePhoto/${id}`,
          uploadedBy: id,
        });
        profilePictureUrl = `/api/files/${result.id}/view`;
      }

      const infoUpdate: Partial<typeof userInfoTable.$inferInsert> = {
        profilePicture: profilePictureUrl,
      };
      if (u) {
        if (u.lastName !== undefined) infoUpdate.lastName = u.lastName;
        if (u.displayName !== undefined) infoUpdate.displayName = u.displayName;
        if (u.phoneNumber !== undefined) infoUpdate.phoneNumber = u.phoneNumber;
        if (u.address !== undefined) infoUpdate.address = u.address;
        if (u.city !== undefined) infoUpdate.city = u.city;
        if (u.state !== undefined) infoUpdate.state = u.state;
        if (u.zipCode !== undefined) infoUpdate.zipCode = u.zipCode;
        if (u.country !== undefined) infoUpdate.country = u.country;
        if (u.bio !== undefined) infoUpdate.bio = u.bio;
        if (u.website !== undefined) infoUpdate.website = u.website;
        if (u.twitter !== undefined) infoUpdate.twitter = u.twitter;
        if (u.facebook !== undefined) infoUpdate.facebook = u.facebook;
        if (u.instagram !== undefined) infoUpdate.instagram = u.instagram;
        if (u.linkedin !== undefined) infoUpdate.linkedin = u.linkedin;
        if (u.youtube !== undefined) infoUpdate.youtube = u.youtube;
        if (u.tiktok !== undefined) infoUpdate.tiktok = u.tiktok;
        if (u.pinterest !== undefined) infoUpdate.pinterest = u.pinterest;
        if (u.reddit !== undefined) infoUpdate.reddit = u.reddit;
        if (u.telegram !== undefined) infoUpdate.telegram = u.telegram;
        if (u.whatsapp !== undefined) infoUpdate.whatsapp = u.whatsapp;
        if (u.viber !== undefined) infoUpdate.viber = u.viber;
        if (u.skype !== undefined) infoUpdate.skype = u.skype;
        if (u.discord !== undefined) infoUpdate.discord = u.discord;
        if (u.twitch !== undefined) infoUpdate.twitch = u.twitch;
        if (u.spotify !== undefined) infoUpdate.spotify = u.spotify;
        if (u.appleMusic !== undefined) infoUpdate.appleMusic = u.appleMusic;
        if (u.amazonMusic !== undefined) infoUpdate.amazonMusic = u.amazonMusic;
        if (u.deezer !== undefined) infoUpdate.deezer = u.deezer;
        if (u.soundcloud !== undefined) infoUpdate.soundcloud = u.soundcloud;
      }
      if (existingInfo) {
        await ctx.db
          .update(userInfoTable)
          .set(infoUpdate)
          .where(eq(userInfoTable.userId, id));
      } else {
        await ctx.db.insert(userInfoTable).values({
          userId: id,
          lastName: (u?.lastName as string) ?? "",
          displayName: (u?.displayName as string) ?? "",
          phoneNumber: (u?.phoneNumber as string) ?? "",
          address: (u?.address as string) ?? "",
          city: (u?.city as string) ?? "",
          state: (u?.state as string) ?? "",
          zipCode: (u?.zipCode as string) ?? "",
          country: (u?.country as string) ?? "",
          profilePicture: profilePictureUrl,
          bio: (u?.bio as string) ?? "",
          website: (u?.website as string) ?? "",
          twitter: (u?.twitter as string) ?? "",
          facebook: (u?.facebook as string) ?? "",
          instagram: (u?.instagram as string) ?? "",
          linkedin: (u?.linkedin as string) ?? "",
          youtube: (u?.youtube as string) ?? "",
          tiktok: (u?.tiktok as string) ?? "",
          pinterest: (u?.pinterest as string) ?? "",
          reddit: (u?.reddit as string) ?? "",
          telegram: (u?.telegram as string) ?? "",
          whatsapp: (u?.whatsapp as string) ?? "",
          viber: (u?.viber as string) ?? "",
          skype: (u?.skype as string) ?? "",
          discord: (u?.discord as string) ?? "",
          twitch: (u?.twitch as string) ?? "",
          spotify: (u?.spotify as string) ?? "",
          appleMusic: (u?.appleMusic as string) ?? "",
          amazonMusic: (u?.amazonMusic as string) ?? "",
          deezer: (u?.deezer as string) ?? "",
          soundcloud: (u?.soundcloud as string) ?? "",
        });
      }
      return { id };
    }),

  delete: createPermissionProcedure("USERS", "DELETE")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [info] = await ctx.db
        .select()
        .from(userInfoTable)
        .where(eq(userInfoTable.userId, input.id))
        .limit(1);
      if (info?.profilePicture) {
        const match = info.profilePicture.match(/\/api\/files\/([^/]+)\/view/);
        if (match?.[1]) {
          try {
            const rec = await getFileRecord(match[1]);
            if (rec) await deleteFile(rec.fileName, rec.bucket);
          } catch {
            // ignore
          }
        }
      }
      await ctx.db.delete(userTable).where(eq(userTable.id, input.id));
      return { id: input.id };
    }),
});
