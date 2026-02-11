import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { permissionsRouter } from "./permissions";
import { userRouter } from "./user";

export const appRouter = createTRPCRouter({
  post: postRouter,
  permissions: permissionsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
