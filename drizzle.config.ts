import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "./src/lib/db/schemas/",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
