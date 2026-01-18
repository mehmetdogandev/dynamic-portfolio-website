import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  list: publicProcedure.query(() => {
    return [
      { id: 1, name: "Mehmet" },
      { id: 2, name: "Ahmet" },
    ];
  }),

  byId: publicProcedure
    .input(String)
    .query(({ input }) => {
      return { id: input, name: "Mehmet" };
    }),
});

