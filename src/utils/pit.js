import { persistedOperation } from './persistedOperation.js'
import { openDate, statusPayload, lifecycleAllows, validNumber } from './chipControl.js';
export { lifecycleAllows };
export { requestGuard } from './buyIn.js';
export const NOTES = [500, 1000, 5000, 10000, 25000];
export const money = value => validNumber(value) ? `NPR ${Number(value).toLocaleString('en-IN')}` : 'Unavailable';
export const RESULT_LABELS = {
  WIN: 'Verified Wins',
  LOSS: 'Verified Losses'
};
export const isPitRoute = path => path === '/pit' || path.startsWith('/pit/') || path === '/gaming-floor-pit';
export const canManage = role => ['PIT_SUPERVISOR', 'SUPER_ADMIN'].includes(role);
export const zeroLeaveAllowed = (total, confirmed) => total > 0 || total === 0 && confirmed === true;
export function quantity(raw) {
  if (raw === '') return 0;
  if (!['string', 'number'].includes(typeof raw) || !/^\d+$/.test(String(raw)) || !Number.isSafeInteger(Number(raw)) || Number(raw) > 2147483647) throw new Error('Enter a whole quantity between 0 and 2147483647. Fractions and negative quantities are not accepted.');
  return Number(raw);
}
export function chipCount(values, allowZero = false) {
  const denominations = {};
  let total = 0;
  for (const [note, raw] of Object.entries(values)) {
    if (!NOTES.includes(Number(note))) throw new Error('Unsupported denomination.');
    const q = quantity(raw);
    if (q) denominations[note] = q;
    total += Number(note) * q;
  }
  if (!Number.isSafeInteger(total) || !allowZero && total <= 0) throw new Error('Enter at least one valid denomination quantity.');
  return {
    denominations,
    total
  };
}
export function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${(/^[=+\-@]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
}
export function overviewCsv(rows) {
  return [['Business Date', 'Table', 'Name', 'Status', 'Active Players', 'Opening Float', 'Chip-In', 'Verified Wins', 'Verified Losses', 'Floor Net'], ...rows.map(r => [r.businessDate, r.tableCode, r.tableName, r.status, r.currentPlayers, r.openingFloat, r.chipIn, r.verifiedWins, r.verifiedLosses, r.netPosition])].map(row => row.map(csvCell).join(',')).join('\n');
}
export function assertOverview(rows, date) {
  if (!Array.isArray(rows)) throw new Error('Overview unavailable.');
  for (const r of rows) {
    if (r.businessDate !== date || !r.physicalTableId || !r.tableCode || !['NOT_OPENED', 'OPEN', 'CLOSED'].includes(r.status) || !['currentPlayers', 'chipIn', 'verifiedWins', 'verifiedLosses', 'netPosition'].every(k => validNumber(r[k])) || r.status !== 'NOT_OPENED' && (!r.operationId || !validNumber(r.openingFloat)) || r.status === 'NOT_OPENED' && (r.operationId !== null || r.openingFloat !== null)) throw new Error('Overview response has unavailable or mismatched Business Date data.');
  }
  return rows;
}
export async function loadOverview(api) {
  const date = openDate(await api.getCurrentOpenBusinessDate());
  if (!date) return {
    date: null,
    rows: null,
    status: null
  };
  const [rows, raw] = await Promise.all([api.getAuthoritativeTables(), api.getOperationalStatus()]);
  const status = statusPayload(raw, date);
  assertOverview(rows, date);
  if (openDate(await api.getCurrentOpenBusinessDate()) !== date) throw new Error('Business Date changed. Refresh before opening a table.');
  return {
    date,
    rows,
    status
  };
}
export function assertSnapshot(s, id) {
  if (!s || s.operationId !== id || !s.businessDate || !['OPEN', 'CLOSED'].includes(s.status) || !Array.isArray(s.players) || !Array.isArray(s.supportedDenominations) || !validNumber(s.operationVerifiedWins) || !validNumber(s.operationVerifiedLosses) || typeof s.systemLocked !== 'boolean' || !s.tableCustody || typeof s.tableCustody.initialized !== 'boolean' || !s.tableCustody.denominations || !validNumber(s.tableCustody.totalValue)) throw new Error('Authoritative table snapshot unavailable.');
  for (const p of s.players) if (!p.assignmentId || !p.customerSessionId || !validNumber(p.verifiedWinTotal) || !validNumber(p.verifiedLossTotal)) throw new Error('Player results unavailable.');
  return s;
}
export const frozen = value => {
  const copy = JSON.parse(JSON.stringify(value));
  const freeze = v => {
    if (v && typeof v === 'object') {
      Object.values(v).forEach(freeze);
      Object.freeze(v);
    }
    return v;
  };
  return freeze(copy);
};
// Pending logical operations survive dialog/route unmounts. No authoritative read data is cached.
function durableMutationStore(actor, module, storage, legacyKey) {
  const durable = persistedOperation({ module, actor: String(actor), storage, legacyKey })
  let version = 0
  durable.subscribe(() => { version++ })
  return {
    recovery: durable, subscribe: durable.subscribe, version: () => version,
    get operation() { return durable.operation?.payload || null },
    get pending() { return durable.pending }, get uncertain() { return Boolean(durable.operation) },
    confirmRecovered() { durable.discard() },
    async run(input, post, retry = false) {
      if (retry && !durable.operation?.payload.idempotent) throw new Error('This operation requires a completion read.')
      const key = retry ? durable.operation.operationKey : crypto.randomUUID()
      const operation = retry ? durable.operation.payload : { ...input, payload: { ...input.payload, ...(input.idempotent ? { idempotencyKey: key } : {}) } }
      // Do not ignore pending operations written by GP1/SM1 before I1B.
      return durable.run({ operationType: operation.kind, operationKey: key, expectedBusinessDate: operation.payload.expectedBusinessDate || operation.date,
        target: { tableId: operation.tableId, label: operation.machineCode }, payload: operation }, op => post(op.payload), { retry, clearDefiniteFailure: true })
    },
  }
}
export function createMutationStore(newKey = () => crypto.randomUUID(), storage = null, storageKey = 'pit-pending', actor = null) {
  if (actor) return durableMutationStore(actor, storageKey.startsWith('machine') ? 'machines' : 'pit', storage, storageKey)
  let operation = null,
    pending = false,
    uncertain = false,
    version = 0;
  try {
    const saved = storage?.getItem(storageKey);
    if (saved) { operation = frozen(JSON.parse(saved)); uncertain = true; }
  } catch { /* Storage may be unavailable; retain the in-memory operation. */ }
  const listeners = new Set(),
    notify = () => {
      try {
        if (operation) storage?.setItem(storageKey, JSON.stringify(operation));
        else storage?.removeItem(storageKey);
      } catch { /* The visible recovery warning also asks the operator to keep the application open. */ }
      version++;
      listeners.forEach(fn => fn());
    };
  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    version: () => version,
    get operation() {
      return operation;
    },
    get pending() {
      return pending;
    },
    get uncertain() {
      return uncertain;
    },
    confirmRecovered() {
      if (!pending) {
        operation = null;
        uncertain = false;
        notify();
      }
    },
    async run(input, post, retry = false) {
      if (pending) throw new Error('Another Pit operation is already in progress.');
      if (uncertain && !retry) throw new Error('Resolve the unconfirmed operation before starting another.');
      if (retry && (!uncertain || !operation?.idempotent)) throw new Error('This operation cannot be blindly retried.');
      if (!retry) operation = frozen({
        ...input,
        payload: {
          ...input.payload,
          ...(input.idempotent ? {
            idempotencyKey: newKey()
          } : {})
        }
      });
      const target = operation,
        wasUncertain = uncertain;
      pending = true;
      notify();
      try {
        const result = await post(target);
        operation = null;
        uncertain = false;
        return result;
      } catch (error) {
        uncertain = wasUncertain || ![400, 401, 403, 404, 409, 422].includes(error?.response?.status);
        if (!uncertain) operation = null;
        throw error;
      } finally {
        pending = false;
        notify();
      }
    }
  };
}
const stores = new Map();
export function mutationStore(actor) {
  if (!stores.has(actor)) {
    let storage = null;
    try { storage = globalThis.sessionStorage } catch {}
    stores.set(actor, createMutationStore(undefined, storage, `pit-pending:${actor}`, actor));
  }
  return stores.get(actor);
}
export async function confirmedThenRefresh(post, refresh, success, warning) {
  const value = await post();
  success(value);
  try {
    await refresh();
  } catch {
    warning('Operation succeeded. Latest state could not be refreshed; do not resubmit. Refresh authoritative data.');
  }
  return value;
}
