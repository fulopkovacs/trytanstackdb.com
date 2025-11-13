import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

const mockBoards = [
  { id: "1", name: "Board One" },
  { id: "2", name: "Board Two" },
  { id: "3", name: "Board Three" },
];

const getBoards = createServerFn().handler(
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
