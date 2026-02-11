import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  createPermissionProcedure,
} from "@/lib/trpc/trpc";
import { roleTable } from "@/lib/db/schemas";
import { permissionEnum } from "@/lib/db/schemas/rbac";


export const roleRouter = createTRPCRouter({
  
});