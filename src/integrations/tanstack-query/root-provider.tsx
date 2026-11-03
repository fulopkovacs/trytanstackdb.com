import { queryClient } from "@/db/query-client";

export function getContext() {
  return {
    queryClient,
  };
}
export default function TanstackQueryProvider() {}
