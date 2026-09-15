import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/pitApi';
import useAuth from '../../hooks/useAuth';
import usePitMutation from '../../hooks/usePitMutation';
import PitMutationStatus from '../../components/pit/PitMutationStatus';
import DenominationQuantityInput from '../../components/pit/DenominationQuantityInput';
import { NOTES, money, canManage, loadOverview, requestGuard, chipCount, overviewCsv, lifecycleAllows } from '../../utils/pit';
const button = 'rounded-lg border px-3 py-2 font-bold disabled:opacity-40';
export default function TableList() {
  const navigate = useNavigate(),
    {
      user
    } = useAuth();
  const [scope, setScope] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [query, setQuery] = useState(''),
    [game, setGame] = useState(''),
    [status, setStatus] = useState(''),
    [staff, setStaff] = useState('');
  const [selected, setSelected] = useState(null),
    [counts, setCounts] = useState({}),
    [remarks, setRemarks] = useState(''),
    [floorMap, setFloorMap] = useState(false);
  const guard = useRef(requestGuard()),
    lastDate = useRef(null);
  const load = useCallback(async () => {
    const current = guard.current.next();
    setLoading(true);
    setScope(null);
    setError('');
    try {
      const next = await loadOverview(api);
      if (!current()) return;
      if (lastDate.current !== next.date) {
        setSelected(null);
        setCounts({});
        setRemarks('');
      }
      lastDate.current = next.date;
      setScope(next);
      setSelected(old => old && old.businessDate === next.date ? next.rows?.find(r => r.physicalTableId === old.physicalTableId) || null : null);
    } catch (e) {
      if (current()) {
        setError(e.message);
        setSelected(null);
        setCounts({});
        setRemarks('');
      }
      throw e;
    } finally {
      if (current()) setLoading(false);
    }
  }, []);
  const mutation = usePitMutation(load);
  useEffect(() => {
    load().catch(() => {});
    return () => guard.current.invalidate();
  }, [load]);
  useEffect(() => {
    const refresh = () => {
      if (!mutation.blocked) load().catch(() => {});
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [load, mutation.blocked]);
  const rows = scope?.rows;
  const filtered = useMemo(() => rows?.filter(r => (!query || `${r.tableCode} ${r.tableName}`.toLowerCase().includes(query.toLowerCase())) && (!game || r.gameType === game) && (!status || r.status === status) && (!staff || [r.activeDealer?.username, r.activeSupervisor?.username].includes(staff))) || [], [rows, query, game, status, staff]);
  const sum = key => rows ? rows.reduce((n, r) => n + Number(r[key]), 0) : null;
  let count = null;
  try {
    count = chipCount(counts);
  } catch {}
  const view = r => {
    setSelected(r);
    setCounts({});
    setRemarks('');
  };
  const open = async () => {
    if (mutation.blocked || loading || !selected || !count || !canManage(user?.role) || !lifecycleAllows(scope?.status, false)) return;
    const target = {
      kind: 'open',
      idempotent: true,
      physicalTableId: selected.physicalTableId,
      tableCode: selected.tableCode,
      date: scope.date,
      payload: {
        denominations: count.denominations,
        remarks: remarks.trim() || null,
        expectedBusinessDate: scope.date
      }
    };
    const outcome = await mutation.perform(target);
    if (outcome.success) {
      setSelected(null);
      setCounts({});
      setRemarks('');
    }
  };
  const exportCsv = () => {
    if (!rows || loading) return;
    const url = URL.createObjectURL(new Blob([overviewCsv(filtered)], {
      type: 'text/csv;charset=utf-8;'
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaming-floor-${scope.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <div className="space-y-5 p-2">
 <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">Gaming Floor / Pit</h1><p>Business Date: {scope?.date || 'Unavailable'}{user?.role === 'DEALER' ? ' · Assigned operation only' : ''}</p></div><div className="flex gap-2"><button className={button} disabled={loading || mutation.blocked} onClick={() => load().catch(() => {})}>Refresh</button><button className={button} disabled={!rows || loading} onClick={exportCsv}>Export CSV</button><button className={button} disabled={!rows} onClick={() => setFloorMap(!floorMap)}>Floor Map</button></div></header>
 <PitMutationStatus mutation={mutation} />{error && <p role="alert" className="bg-red-50 p-3">{error}</p>}{loading && <p role="status">Loading authoritative floor…</p>}{!loading && !rows && <p>Current Business Date and floor data unavailable. Opening is disabled.</p>}
 <div className="grid gap-3 sm:grid-cols-4">{[['Active Tables', rows ? rows.filter(r => r.status === 'OPEN').length : 'Unavailable'], ['Players on Floor', rows ? sum('currentPlayers') : 'Unavailable'], ['Total Chip-In', money(sum('chipIn'))], ['Floor Net', money(sum('netPosition'))]].map(([label, value]) => <div className="rounded-xl border bg-white p-4" key={label}><p>{label}</p><strong className="text-xl">{value}</strong></div>)}</div>
 <p className="text-sm">Floor Net = Verified Losses − Verified Wins, for the whole loaded Business Date scope. Verified results are financial records; they do not establish physical chip payment. Chip-In is gross customer-to-table custody movement.</p>
 <div className="flex flex-wrap gap-2"><input aria-label="Find table" className="rounded border p-2" value={query} onChange={e => setQuery(e.target.value)} placeholder="Table code or name" /><select aria-label="Game filter" value={game} onChange={e => setGame(e.target.value)}><option value="">All games</option>{[...new Set(rows?.map(r => r.gameType))].map(g => <option key={g}>{g}</option>)}</select><select aria-label="State filter" value={status} onChange={e => setStatus(e.target.value)}><option value="">All states</option>{['NOT_OPENED', 'OPEN', 'CLOSED'].map(s => <option key={s}>{s}</option>)}</select><select aria-label="Staff filter" value={staff} onChange={e => setStaff(e.target.value)}><option value="">All staff</option>{[...new Set(rows?.flatMap(r => [r.activeDealer?.username, r.activeSupervisor?.username]).filter(Boolean))].map(s => <option key={s}>{s}</option>)}</select></div>
 {floorMap && rows && <section className="grid gap-3 sm:grid-cols-3" aria-label="Floor status map">{rows.map(r => <button key={r.physicalTableId} className="rounded border bg-white p-4 text-left" onClick={() => view(r)}><strong>{r.tableCode} · {r.tableName}</strong><p>{r.status} · {r.currentPlayers} active players</p></button>)}</section>}
 {rows && <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{['Table', 'State', 'Dealer / Supervisor', 'Active Players', 'Opening Float', 'Chip-In', 'Verified Wins', 'Verified Losses', 'Floor Net', 'Actions'].map(t => <th className="p-3" key={t}>{t}</th>)}</tr></thead><tbody>{filtered.map(r => <tr key={r.physicalTableId} className="border-t"><td className="p-3"><strong>{r.tableCode}</strong><p>{r.tableName}</p></td><td>{r.status}</td><td>{r.activeDealer?.displayName || r.activeDealer?.username || 'Not assigned'} / {r.activeSupervisor?.displayName || r.activeSupervisor?.username || 'Not assigned'}</td><td>{r.currentPlayers}</td><td>{r.operationId ? money(r.openingFloat) : 'Not established'}</td><td>{money(r.chipIn)}</td><td>{money(r.verifiedWins)}</td><td>{money(r.verifiedLosses)}</td><td>{money(r.netPosition)}</td><td><button className={button} onClick={() => view(r)}>View</button>{r.operationId ? <button className={button} onClick={() => navigate(`/pit/tables/${r.operationId}${user?.role === 'DEALER' ? '/mode' : ''}`)}>Manage / View</button> : canManage(user?.role) && <button className={button} disabled={mutation.blocked || !lifecycleAllows(scope.status, false) || r.physicalStatus !== 'ACTIVE'} onClick={() => view(r)}>Open Table</button>}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-4">No matching authoritative tables.</p>}</div>}
 {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-label="Pit table" className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-auto rounded-xl bg-white p-5"><h2 className="text-xl font-bold">{selected.tableCode} · {selected.tableName}</h2><p>State: {selected.status} · Business Date {selected.businessDate}</p><p>Opening Float: {selected.operationId ? money(selected.openingFloat) : 'Not established'}</p>
 {!selected.operationId && canManage(user?.role) && <><p>Opening transfers these physical denominations from CAGE to this table. The backend checks inventory, date, lifecycle and the opening transition.</p><DenominationQuantityInput denominations={NOTES} quantities={counts} onChange={setCounts} disabled={mutation.blocked || loading} totalLabel="Calculated opening physical custody" /><label>Opening remarks<textarea className="w-full border p-2" maxLength={500} value={remarks} onChange={e => setRemarks(e.target.value)} disabled={mutation.blocked} /></label>{!lifecycleAllows(scope?.status, false) && <p role="alert">Opening unavailable under the current Business Date / System Lock prerequisites.</p>}<button className={button} disabled={!count || mutation.blocked || loading || !lifecycleAllows(scope?.status, false) || selected.physicalStatus !== 'ACTIVE'} onClick={open}>Open Table & Issue Float</button></>}
 {selected.operationId && <button className={button} onClick={() => navigate(`/pit/tables/${selected.operationId}`)}>View operation</button>}<button className={button} onClick={() => setSelected(null)}>Close dialog</button>
 </section></div>}
 </div>;
}
