import { headers } from "next/headers";

export async function createContext() {
  return {
    headers: headers(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

