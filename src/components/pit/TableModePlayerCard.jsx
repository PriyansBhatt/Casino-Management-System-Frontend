import { money } from '../../utils/pit'


const TableModePlayerCard = ({ player, operational, newActivityAllowed = operational, mutationPending, onCustody, onResult, onLeave }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">{player.customerCode}</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">{player.customerName}</h2>
        <p className="mt-1 font-mono text-xs font-bold text-slate-500">{player.sessionCode}</p>
      </div>
      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
        {player.status}
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
      <Datum label="Badge" value={player.badge || 'Badge unavailable'} />
      <Datum label="Joined" value={player.joinedAt
        ? new Date(player.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Unavailable'} />
      <Datum label="Customer Custody"
        value={player.custodyInitialized ? money(player.custodyTotal) : 'Not initialized'} />
      <Datum label="Assignment Net (Loss − Win)" value={money(player.netPosition)} />
      <Datum label="Verified WIN" value={money(player.verifiedWinTotal)} tone="green" />
      <Datum label="Verified LOSS" value={money(player.verifiedLossTotal)} tone="red" />
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
      <button type="button" onClick={() => onCustody('CHIP_IN', player)}
        disabled={!newActivityAllowed || mutationPending}
        className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-2 text-[10px] font-black text-amber-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-75">
        CHIP-IN
      </button>
      {['WIN', 'LOSS'].map((action) => (
        <button key={action} type="button" onClick={() => onResult(action, player)}
          disabled={!newActivityAllowed || mutationPending}
          className={`min-h-11 rounded-xl border px-2 text-[10px] font-black disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-75 ${action === 'WIN'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : 'border-red-300 bg-red-50 text-red-700'}`}>
          {action}
        </button>
      ))}
      <button type="button" onClick={() => onCustody('RETURN', player)}
        disabled={!operational || mutationPending}
        className="min-h-11 rounded-xl border border-sky-300 bg-sky-50 px-2 text-[10px] font-black text-sky-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-75">
        RETURN
      </button>
      <button type="button" onClick={() => onLeave(player)} disabled={!operational || mutationPending}
        className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-2 text-[10px] font-black text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-75">
        LEAVE TABLE
      </button>
    </div>
    <p className="mt-3 text-center text-xs font-bold text-slate-400">Gaming results and physical custody movements are recorded separately.</p>
  </article>
)

const Datum = ({ label, value, tone }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 font-black ${tone === 'green' ? 'text-emerald-700'
      : tone === 'red' ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
  </div>
)

export default TableModePlayerCard
