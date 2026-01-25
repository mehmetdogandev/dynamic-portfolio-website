import { appRouter } from "@/server/api/routers";
import { createCallerFactory } from "@/server/api/trpc";

export type { AppRouter } from "@/server/api/routers";

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
