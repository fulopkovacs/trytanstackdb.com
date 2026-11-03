import type { Transaction } from "@tanstack/react-db";

/**
 * Keeps one paced mutation per record, shared by everything that changes it.
 * A paced mutation saves its transactions one after another, in order, but
 * only its own: two paced mutations (or a paced one and a direct update) for
 * the same record could overlap, and the older one's unsaved state would
 * cover the newer one's. Sharing one per record avoids that.
 *
 * It's created on first use and dropped once its last transaction settles.
 */
export function pacedPerRecord<TVariables, T extends object>(
  create: (id: string) => (variables: TVariables) => Transaction<T>,
) {
  const instances = new Map<
    string,
    { mutate: (variables: TVariables) => Transaction<T>; unsettled: Set<Transaction<T>> }
  >();

  return {
    mutate(id: string, variables: TVariables): Transaction<T> {
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
    },

    /** Rolls back the record's changes that haven't started saving yet. */
    cancelPending(id: string) {
      for (const transaction of instances.get(id)?.unsettled ?? []) {
        if (transaction.state === "pending") transaction.rollback();
      }
    },
  };
}
