export { appRouter } from "./routers";
export type { AppRouter } from "./routers";

import { appRouter } from "./routers";
import { createCallerFactory } from "./trpc";

export const createCaller = createCallerFactory(appRouter);
