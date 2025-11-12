import { createServerFn } from "@tanstack/react-start";
import { authRequiredMiddleware } from "@/lib/auth-middleware";
import { queryOptions } from "@tanstack/react-query";

const mockBoards = [
  { id: "1", name: "Board One" },
  { id: "2", name: "Board Two" },
  { id: "3", name: "Board Three" },
];

const getBoards = createServerFn()
  .middleware([authRequiredMiddleware])
  .handler(
    async (
      // { context }
    ) => {
      // In a real app, you'd fetch boards from a database here
      return { boards: mockBoards };
    },
  );

export const getBoardsQueryOptions = queryOptions({
  queryKey: ["boards"],
  queryFn: getBoards,
});
