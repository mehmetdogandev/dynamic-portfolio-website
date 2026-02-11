import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/trpc";
import { posts } from "@/lib/db/schemas";

export const postRouter = createTRPCRouter({
 
});
