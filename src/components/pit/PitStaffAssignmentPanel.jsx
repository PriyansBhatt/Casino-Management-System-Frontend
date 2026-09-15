import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/pitApi';
import useAuth from '../../hooks/useAuth';
import usePitMutation from '../../hooks/usePitMutation';
import PitMutationStatus from './PitMutationStatus';
import { canManage, requestGuard, lifecycleAllows } from '../../utils/pit';
const button = 'rounded border px-3 py-2 font-bold disabled:opacity-40';
export default function PitStaffAssignmentPanel({
  tableId,
  tableOpen,
  date,
  lifecycle,
  onStaffChange
}) {
  const {
      user
    } = useAuth(),
    [staff, setStaff] = useState(null),
    [history, setHistory] = useState(null),
    [historyOpen, setHistoryOpen] = useState(false),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null),
    [candidates, setCandidates] = useState(null),
    [candidate, setCandidate] = useState(''),
    [remarks, setRemarks] = useState('');
  const activeGuard = useRef(requestGuard()),
    historyGuard = useRef(requestGuard()),
    candidateGuard = useRef(requestGuard());
  const validate = rows => {
    if (!Array.isArray(rows) || rows.some(r => r.pitTableId !== tableId || r.businessDate !== date || !r.assignmentId || !['DEALER', 'PIT_SUPERVISOR'].includes(r.assignmentRole))) throw new Error('Staff response context unavailable.');
    return rows;
  };
  const load = useCallback(async () => {
    const current = activeGuard.current.next();
    setLoading(true);
    setStaff(null);
    onStaffChange?.(null);
    try {
      const rows = validate(await api.getActiveTableStaff(tableId));
      if (current()) {
        setStaff(rows);
        onStaffChange?.(rows);
        setError('');
      }
    } catch (e) {
      if (current()) setError(e.message);
      throw e;
    } finally {
      if (current()) setLoading(false);
    }
  }, [tableId, date, onStaffChange]);
  const loadHistory = async () => {
    const current = historyGuard.current.next();
    setHistoryOpen(true);
    setHistory(null);
    try {
      const rows = validate(await api.getTableStaffHistory(tableId));
      if (current()) setHistory(rows);
    } catch (e) {
      if (current()) setError(e.message);
    }
  };
  const mutation = usePitMutation(async () => {
    await load();
    if (historyOpen) await loadHistory();
  });
  useEffect(() => {
    load().catch(() => {});
    return () => {
      activeGuard.current.invalidate();
      historyGuard.current.invalidate();
      candidateGuard.current.invalidate();
    };
  }, [load]);
  const begin = async (type, role, row) => {
    if (mutation.blocked) return;
    const current = candidateGuard.current.next();
    setAction({
      type,
      role,
      row
    });
    setCandidate('');
    setRemarks('');
    setCandidates(null);
    setError('');
    if (type === 'end') return;
    try {
      const values = await api.getPitStaffCandidates(role);
      if (!Array.isArray(values)) throw new Error('Staff candidates unavailable.');
      if (current()) setCandidates(values);
    } catch (e) {
      if (current()) setError(e.message);
    }
  };
  const submit = async () => {
    if (!action || mutation.blocked || loading || !tableOpen || !canManage(user?.role) || !lifecycleAllows(lifecycle, action.type === 'end')) return;
    const payload = {
      remarks: remarks.trim() || null
    };
    if (action.type === 'assign') Object.assign(payload, {
      staffUserId: candidate,
      assignmentRole: action.role
    });
    if (action.type === 'handover') payload.newStaffUserId = candidate;
    const outcome = await mutation.perform({
      kind: `staff-${action.type}`,
      idempotent: true,
      date,
      tableId,
      assignmentId: action.row?.assignmentId,
      role: action.role,
      payload
    });
    if (outcome.success) {
      candidateGuard.current.invalidate();
      setAction(null);
    }
  };
  return <section className="space-y-3 rounded-xl border bg-white p-4"><h2 className="text-xl font-bold">Table staff</h2><PitMutationStatus mutation={mutation} />{error && <p role="alert">{error}</p>}{loading ? <p>Loading staff…</p> : staff === null ? <p>Staff unavailable.</p> : ['DEALER', 'PIT_SUPERVISOR'].map(role => {
      const row = staff.find(r => r.assignmentRole === role);
      return <div key={role} className="flex flex-wrap items-center gap-3"><strong>{role}: {row?.fullName || row?.username || 'Not assigned'}</strong>{canManage(user?.role) && tableOpen && <>{row ? <><button className={button} disabled={mutation.blocked || !lifecycleAllows(lifecycle, false)} onClick={() => begin('handover', role, row)}>Handover</button><button className={button} disabled={mutation.blocked || !lifecycleAllows(lifecycle, true)} onClick={() => begin('end', role, row)}>End assignment</button></> : <button className={button} disabled={mutation.blocked || !lifecycleAllows(lifecycle, false)} onClick={() => begin('assign', role)}>Assign</button>}</>}</div>;
    })}
 <button className={button} disabled={mutation.blocked} onClick={() => load().catch(() => {})}>Refresh staff</button><button className={button} onClick={loadHistory}>Assignment history</button>
 {historyOpen && <div><button className={button} onClick={() => {
        historyGuard.current.invalidate();
        setHistoryOpen(false);
      }}>Hide history</button>{history === null ? <p>History loading / unavailable.</p> : history.map(r => <p key={r.assignmentId}>{r.fullName || r.username} · {r.assignmentRole} · {r.businessDate} · {r.startedAt} → {r.endedAt || 'Active'} · {r.endRemarks || r.remarks || ''}</p>)}</div>}
 {action && <div className="rounded border border-amber-300 p-4"><h3>{action.type} {action.role} · {date}</h3>{action.type !== 'end' && <select aria-label="Staff candidate" value={candidate} disabled={!candidates || mutation.blocked} onChange={e => setCandidate(e.target.value)}><option value="">Select active staff</option>{candidates?.map(c => <option key={c.id} value={c.id}>{c.fullName || c.displayName || c.username}</option>)}</select>}<textarea aria-label="Staff remarks" maxLength={1000} value={remarks} disabled={mutation.blocked} onChange={e => setRemarks(e.target.value)} /><button className={button} disabled={mutation.blocked || action.type !== 'end' && !candidate} onClick={submit}>Confirm</button><button className={button} onClick={() => {
        candidateGuard.current.invalidate();
        setAction(null);
      }}>Close dialog</button></div>}
 </section>;
}
