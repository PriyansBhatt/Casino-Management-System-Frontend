import PendingOperation from '../ui/PendingOperation'
export default function PitMutationStatus({
  mutation
}) {
  const {
    notice,
    error,
    store,
    recover
  } = mutation;
  return <>{notice && <p role="status" className="rounded bg-green-50 p-3">{notice}</p>}{error && <p role="alert" className="rounded bg-red-50 p-3">{error}</p>}{store.recovery && store.operation?.idempotent && <PendingOperation store={store.recovery} retry={recover} />}{store.uncertain && (!store.recovery || !store.operation.idempotent) && <section className="rounded border border-amber-400 bg-amber-50 p-4"><p>Unconfirmed {store.operation.kind} · Business Date {store.operation.date} · table {store.operation.tableCode || store.operation.tableId || store.operation.physicalTableId}. The original target, quantities and reference are retained even if this dialog is closed. Keep this application open while resolving it.</p><button disabled={store.pending} onClick={recover} className="mt-2 rounded border p-2">{store.operation.idempotent ? 'Retry exact saved request' : 'Check authoritative completion'}</button></section>}</>;
}
