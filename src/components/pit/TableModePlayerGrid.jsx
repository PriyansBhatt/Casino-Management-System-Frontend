import TableModePlayerCard from './TableModePlayerCard'

const TableModePlayerGrid = ({ players, operational, mutationPending, onCustody, onResult, onLeave }) => {
  if (!players?.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h2 className="text-xl font-black text-slate-900">No players currently assigned to this table.</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Use Add Player to assign an eligible active casino session.
        </p>
      </section>
    )
  }

  return (
    <section className={`grid gap-4 ${players.length === 1
      ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'}`}>
      {players.map((player) => (
        <TableModePlayerCard key={player.assignmentId} player={player} operational={operational}
          mutationPending={mutationPending} onCustody={onCustody} onResult={onResult}
          onLeave={onLeave} />
      ))}
    </section>
  )
}

export default TableModePlayerGrid
