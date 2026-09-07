const money = (value) => `NPR ${Number(value || 0).toLocaleString('en-IN')}`

const staffName = (staff) => staff?.displayName || staff?.username || 'Not assigned'

const formatTime = (value) => value
  ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : 'Unavailable'

const TableModeHeader = ({ snapshot, lastRefreshedAt, refreshing, stale, onRefresh, onExit }) => {
  const denominations = Object.entries(snapshot.tableCustody?.denominations || {})
    .filter(([, quantity]) => Number(quantity) > 0)
    .sort(([left], [right]) => Number(left) - Number(right))

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3">
          <button type="button" onClick={onExit}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700">
            ← Exit Table Mode
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Dealer Table Mode</p>
            <h1 className="truncate text-2xl font-black text-slate-950">
              {snapshot.tableCode} · {snapshot.tableName}
            </h1>
            <p className="text-sm font-semibold text-slate-500">
              {snapshot.gameType} · Business Date {snapshot.businessDate || 'Unavailable'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-2 text-xs font-black ${snapshot.status === 'OPEN'
              ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              {snapshot.status}
            </span>
            <button type="button" onClick={onRefresh} disabled={refreshing}
              className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-60">
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-3 px-4 pt-4 sm:grid-cols-2 xl:grid-cols-5 md:px-6">
        <Info label="Dealer" value={staffName(snapshot.activeDealer)} detail={formatTime(snapshot.activeDealer?.startedAt)} />
        <Info label="Pit Supervisor" value={staffName(snapshot.activeSupervisor)} detail={formatTime(snapshot.activeSupervisor?.startedAt)} />
        <Info label="Active Players" value={snapshot.players?.length || 0} />
        <Info label="Current Table Chip Custody"
          value={snapshot.tableCustody?.initialized ? money(snapshot.tableCustody.totalValue) : 'Not initialized'}
          detail={denominations.length
            ? denominations.map(([denomination, quantity]) => `NPR ${Number(denomination).toLocaleString('en-IN')} × ${quantity}`).join(' · ')
            : snapshot.tableCustody?.initialized ? 'No chips recorded' : 'Unavailable'} />
        <Info label="Last Confirmed"
          value={lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'Not refreshed'}
          detail={stale ? 'Unable to refresh' : 'Connected'} tone={stale ? 'warning' : 'success'} />
      </section>
    </>
  )
}

const Info = ({ label, value, detail, tone }) => (
  <div className={`rounded-2xl border bg-white p-4 shadow-sm ${tone === 'warning'
    ? 'border-amber-300' : tone === 'success' ? 'border-emerald-200' : 'border-slate-200'}`}>
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-1 break-words text-base font-black text-slate-950">{value}</p>
    {detail && <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>}
  </div>
)

export default TableModeHeader
