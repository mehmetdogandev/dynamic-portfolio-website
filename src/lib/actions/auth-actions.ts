"use server";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schemas";
import { eq } from "drizzle-orm";

export async function checkEmailExists(email: string): Promise<boolean> {
  const [found] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email.toLowerCase().trim()))
    .limit(1);
  return !!found;
}
