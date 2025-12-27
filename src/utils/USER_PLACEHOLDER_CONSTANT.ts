import type { UserRecord } from "@/db/schema";

/**
  @note placeholder for the user data
 (we might have users in the future)
*/
export const USER_PLACEHOLDER = {
  id: "user-1",
  name: "Alice Smith",
  age: 28,
  email: "alice@example.com",
} satisfies UserRecord;
