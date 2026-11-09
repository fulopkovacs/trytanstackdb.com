import type { Transaction } from "@tanstack/react-db";
import { expect, it } from "vite-plus/test";

import { pacedPerRecord } from "./paced-per-record";

/** Stands in for a transaction: all the helper uses is `when("settled")`. */
function fakeTransaction() {
  let settle!: () => void;
  const settled = new Promise<void>((resolve) => (settle = resolve));
  const fake = {
    state: "pending",
    when: () => settled,
    rollback: () => {
      fake.state = "failed";
      settle();
    },
  };
  const transaction = fake as unknown as Transaction<object>;
  return { transaction, settle: async () => (settle(), await settled, await tick()) };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

it("shares one instance per record until all its transactions settle", async () => {
  const created: string[] = [];
  const transactions = [fakeTransaction(), fakeTransaction(), fakeTransaction()];
  let next = 0;
  const records = pacedPerRecord((id) => {
    created.push(id);
    return () => transactions[next++]!.transaction;
  });

  records.mutate("a", undefined);
  records.mutate("a", undefined);
  expect(created).toEqual(["a"]);

  await transactions[0]!.settle();
  records.mutate("a", undefined); // "a" still has an unsettled transaction: same instance
  expect(created).toEqual(["a"]);

  await transactions[1]!.settle();
  await transactions[2]!.settle();
  next = 0;
  transactions.splice(0, 3, fakeTransaction(), fakeTransaction(), fakeTransaction());
  records.mutate("a", undefined); // all settled: a fresh instance
  expect(created).toEqual(["a", "a"]);
});

it("cancels a record's changes that haven't started saving", async () => {
  const pending = fakeTransaction();
  const saving = fakeTransaction();
  (saving.transaction as { state: string }).state = "persisting";
  const queue = [saving, pending];
  const records = pacedPerRecord(() => () => queue.shift()!.transaction);
  records.mutate("a", undefined);
  records.mutate("a", undefined);

  records.cancelPending("a");
  expect(pending.transaction.state).toBe("failed");
  expect(saving.transaction.state).toBe("persisting");
});
