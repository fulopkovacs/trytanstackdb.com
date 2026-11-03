import type { Transaction } from "@tanstack/react-db";

/**
 * Keeps one paced mutation per record, shared by everything that edits it.
 * A paced mutation saves its transactions one after another, in order, but
 * only its own: two editors with their own paced mutation for the same note
 * could still save out of order. Sharing one per record fixes that.
 *
 * It's created on first use and dropped once its last transaction settles.
 */
export function pacedPerRecord<TVariables, T extends object>(
  create: (id: string) => (variables: TVariables) => Transaction<T>,
): (id: string, variables: TVariables) => Transaction<T> {
  const instances = new Map<
    string,
    { mutate: (variables: TVariables) => Transaction<T>; unsettled: Set<Transaction<T>> }
  >();

  return (id, variables) => {
    let instance = instances.get(id);
    if (!instance) {
      instance = { mutate: create(id), unsettled: new Set() };
      instances.set(id, instance);
    }
    const { mutate, unsettled } = instance;
    const transaction = mutate(variables);
    if (!unsettled.has(transaction)) {
      unsettled.add(transaction);
      const settled = () => {
        unsettled.delete(transaction);
        if (unsettled.size === 0 && instances.get(id) === instance) instances.delete(id);
      };
      transaction.when("settled").then(settled, settled);
    }
    return transaction;
  };
}
