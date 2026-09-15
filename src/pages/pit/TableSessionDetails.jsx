import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/pitApi';
import useAuth from '../../hooks/useAuth';
import usePitMutation from '../../hooks/usePitMutation';
import PitMutationStatus from '../../components/pit/PitMutationStatus';
import PitStaffAssignmentPanel from '../../components/pit/PitStaffAssignmentPanel';
import DealerTableMode from './DealerTableMode';
import { money, canManage, requestGuard, lifecycleAllows } from '../../utils/pit';
import { statusPayload } from '../../utils/chipControl';
const button = 'rounded border px-3 py-2 font-bold disabled:opacity-40';
function Operation() {
  const {
      tableId
    } = useParams(),
    navigate = useNavigate(),
    {
      user
    } = useAuth();
  const [context, setContext] = useState(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [closing, setClosing] = useState(''),
    [review, setReview] = useState(false),
    [revision, setRevision] = useState(0),
    [history, setHistory] = useState(null),
    [historyOpen, setHistoryOpen] = useState(false),
    [resultHistory, setResultHistory] = useState(null),
    [historyPlayer, setHistoryPlayer] = useState(null);
  const guard = useRef(requestGuard()),
    historyGuard = useRef(requestGuard()),
    resultGuard = useRef(requestGuard());
  const load = useCallback(async () => {
    const current = guard.current.next();
    setLoading(true);
    setContext(null);
    setError('');
    try {
      const [table, reconciliation, snapshot, raw] = await Promise.all([api.getAuthoritativeTable(tableId), api.getTableReconciliation(tableId), api.getPitTableMode(tableId), api.getOperationalStatus().catch(() => null)]);
      if (table.id !== tableId || snapshot.operationId !== tableId || reconciliation.tableId !== tableId) throw new Error('Table context unavailable.');
      let lifecycle = null;
      try {
        lifecycle = statusPayload(raw, table.businessDate);
      } catch {}
      if (current()) {
        setContext({
          table,
          reconciliation,
          snapshot,
          lifecycle
        });
        setRevision(r => r + 1);
      }
    } catch (e) {
      if (current()) setError(e.message);
      throw e;
    } finally {
      if (current()) setLoading(false);
    }
  }, [tableId]);
  const mutation = usePitMutation(load);
  useEffect(() => {
    load().catch(() => {});
    return () => {
      guard.current.invalidate();
      historyGuard.current.invalidate();
      resultGuard.current.invalidate();
    };
  }, [load]);
  const close = async () => {
    if (mutation.blocked || !context || !canManage(user?.role)) return;
    if (!/^\d{1,17}(\.\d{1,2})?$/.test(closing)) {
      setError('Enter a nonnegative closing float with at most two decimals.');
      return;
    }
    // Count is only a declared closing float. Backend enforces all close prerequisites.
    const outcome = await mutation.perform({
      kind: 'close',
      idempotent: false,
      tableId,
      date: context.table.businessDate,
      payload: {
        closingFloat: closing
      }
    });
    if (outcome.success) {
      setClosing('');
      setReview(false);
    }
  };
  const loadHistory = async () => {
    const current = historyGuard.current.next();
    setHistoryOpen(true);
    setHistory(null);
    try {
      const rows = await api.getPlayerHistory(tableId);
      if (current()) setHistory(rows);
    } catch (e) {
      if (current()) setError(e.message);
    }
  };
  const inspectResults = async player => {
    const current = resultGuard.current.next();
    setHistoryPlayer(player);
    setResultHistory(null);
    try {
      const rows = await api.getVerifiedGamingResults(player.customerSessionId);
      if (current()) setResultHistory(rows.filter(r => r.assignmentId === player.assignmentId));
    } catch (e) {
      if (current()) setError(e.message);
    }
  };
  const s = context?.snapshot,
    t = context?.table,
    r = context?.reconciliation;
  const staffCount = s ? [s.activeDealer, s.activeSupervisor].filter(Boolean).length : null;
  const eligible = t?.status === 'OPEN' && s.players.length === 0 && staffCount === 0 && s.tableCustody.initialized && Number(s.tableCustody.totalValue) === 0 && lifecycleAllows(context.lifecycle, true);
  return <div className="space-y-4"><button className={button} onClick={() => navigate('/pit/tables')}>Back to Gaming Floor</button><PitMutationStatus mutation={mutation} />{error && <p role="alert">{error}</p>}{loading && <p>Loading table prerequisites…</p>}
 {context && <><header className="rounded-xl border bg-white p-5"><h1 className="text-2xl font-bold">{t.tableCode} · {t.tableName}</h1><p>Business Date {t.businessDate} · {t.status} · Opened {t.openedAt || 'Unavailable'}</p><p>Opening Float {money(t.openingFloat)}</p><button className={button} disabled={mutation.blocked} onClick={() => load().catch(() => {})}>Refresh operation</button><button className={button} onClick={() => setReview(!review)}>Table Reconciliation</button></header>
 {review && <section className="rounded border bg-white p-4"><h2 className="font-bold">Table float comparison</h2><p>Opening: {money(r.openingFloat)} · Entered closing float: {money(r.closingFloat)} · Difference: {money(r.tableDifference)} · Operation: {t.status}</p><p>Difference = opening float − entered closing float. This is not movement-adjusted financial profit/loss or a physical denomination reconciliation.</p>{r.tableStatus === 'LEGACY_RESOLVED' && <p>Legacy reconciliation resolution recorded.</p>}</section>}
 <PitStaffAssignmentPanel key={`${tableId}-${revision}`} tableId={tableId} tableOpen={t.status === 'OPEN'} date={t.businessDate} lifecycle={context.lifecycle} />
 {canManage(user?.role) && <section className="rounded border bg-white p-4"><h2 className="text-xl font-bold">Close Table prerequisites</h2><p>Active players: {s.players.length} · Active staff: {staffCount} · Physical table custody: {s.tableCustody.initialized ? money(s.tableCustody.totalValue) : 'Unavailable'}</p><ol className="list-decimal pl-5"><li>Resolve and leave player assignments.</li><li>Return physical table chips to CAGE through Chip Control.</li><li>Explicitly end Dealer and Pit Supervisor assignments.</li><li>Refresh these prerequisites, review the entered closing float, then close.</li></ol><p>Closing does not perform these steps automatically. The backend rechecks every prerequisite.</p>{!lifecycleAllows(context.lifecycle, true) && <p>Current date / lifecycle unavailable for close.</p>}<label>Entered closing float (NPR)<input className="m-2 border p-2" inputMode="decimal" value={closing} onChange={e => setClosing(e.target.value)} disabled={mutation.blocked} /></label><button className={button} disabled={!eligible || mutation.blocked || !closing} onClick={close}>Confirm Close Table</button></section>}
 <DealerTableMode embedded refreshTick={revision} />
 <section><button className={button} onClick={loadHistory}>Load player assignment history</button>{historyOpen && (history === null ? <p>History loading / unavailable.</p> : history.map(p => <p key={p.assignmentId}>{p.customerName} · {p.sessionCode} · {p.businessDate} · {p.status} · {p.joinedAt} → {p.leftAt || 'Active'} <button className={button} onClick={() => inspectResults(p)}>View recorded results</button></p>))}{historyPlayer && <div><strong>Recorded results · {historyPlayer.customerName}</strong>{resultHistory === null ? <p>Results loading / unavailable.</p> : resultHistory.length === 0 ? <p>No recorded results for this assignment.</p> : resultHistory.map(r => <p key={r.id}>{r.businessDate} · {r.resultType} · {money(r.amount)} · {r.createdAt}</p>)}</div>}</section>
 </>}
 </div>;
}
export default function TableSessionDetails() {
  const {
    tableId
  } = useParams();
  return <Operation key={tableId} />;
}
