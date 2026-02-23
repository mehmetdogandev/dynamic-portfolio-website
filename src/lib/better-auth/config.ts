import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";

function getTrustedOrigins(): string[] {
  const origins = new Set<string>();

  const raw = process.env.TRUSTED_ORIGINS;
  if (raw?.trim()) {
    for (const o of raw.split(",")) {
      const v = o.trim();
      if (v) origins.add(v);
    }
  }

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.add(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Her zaman local geliştirme origin'ini güvenilir kıl
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
  }

  if (origins.size === 0) {
    origins.add("http://localhost:3000");
  }

  return Array.from(origins);
}

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000",
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      const { sendResetPasswordEmail } = await import("@/lib/email/send-reset");

      if (process.env.NODE_ENV === "development") {
        console.log("[Better Auth] Password reset URL for", user.email, ":", url);
      }

      await sendResetPasswordEmail({ to: user.email, url });
    },
  },
});

export type Session = typeof auth.$Infer.Session;
