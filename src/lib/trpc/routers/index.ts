import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { permissionsRouter } from "./permissions";
import { userRouter } from "./user";
import { roleRouter } from "./role";
import { roleGroupRouter } from "./role-group";
import { userRoleRouter } from "./user-role";
import { userRoleGroupRouter } from "./user-role-group";
import { logoRouter } from "./logo";
import { profileRouter } from "./profile";
import { projectCategoryRouter } from "./project-category";
import { projectRouter } from "./project";
import { fileRouter } from "./file";

export const appRouter = createTRPCRouter({
  post: postRouter,
  permissions: permissionsRouter,
  user: userRouter,
  role: roleRouter,
  roleGroup: roleGroupRouter,
  userRole: userRoleRouter,
  userRoleGroup: userRoleGroupRouter,
  logo: logoRouter,
  profile: profileRouter,
  projectCategory: projectCategoryRouter,
  project: projectRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
