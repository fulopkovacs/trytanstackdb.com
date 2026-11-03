import type { Transaction } from "@tanstack/react-db";
import { expect, it } from "vite-plus/test";

import { pacedPerRecord } from "./paced-per-record";

/** Stands in for a transaction: all the helper uses is `when("settled")`. */
function fakeTransaction() {
  let settle!: () => void;
  const settled = new Promise<void>((resolve) => (settle = resolve));
  const transaction = { when: () => settled } as unknown as Transaction<object>;
  return { transaction, settle: async () => (settle(), await settled, await tick()) };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

it("shares one instance per record until all its transactions settle", async () => {
  const created: string[] = [];
  const transactions = [fakeTransaction(), fakeTransaction(), fakeTransaction()];
  let next = 0;
  const mutate = pacedPerRecord((id) => {
    created.push(id);
    return () => transactions[next++]!.transaction;
  });

  mutate("a", undefined);
  mutate("a", undefined);
  expect(created).toEqual(["a"]);

  await transactions[0]!.settle();
  mutate("a", undefined); // "a" still has an unsettled transaction: same instance
  expect(created).toEqual(["a"]);

  await transactions[1]!.settle();
  await transactions[2]!.settle();
  next = 0;
  transactions.splice(0, 3, fakeTransaction(), fakeTransaction(), fakeTransaction());
  mutate("a", undefined); // all settled: a fresh instance
  expect(created).toEqual(["a", "a"]);
});
