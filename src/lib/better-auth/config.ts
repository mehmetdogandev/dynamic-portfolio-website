import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Better Auth] Password reset URL for", user.email, ":", url);
        return;
      }
      // Production: configure your email service (Resend, Nodemailer, etc.)
      throw new Error("E-posta yapılandırması gerekli. sendResetPassword için e-posta servisi ekleyin.");
    },
  },
});

export type Session = typeof auth.$Infer.Session;
