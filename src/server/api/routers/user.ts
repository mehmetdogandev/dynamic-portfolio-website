import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { user, } from "@/server/db/schemas";
import { onlyNotDeleted, withNotDeleted} from "@/server/db/utils";

export const userRouter = createTRPCRouter({
});
