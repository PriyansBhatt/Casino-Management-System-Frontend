const LockedActionNotice = () => {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <p className="font-semibold">System Locked</p>
      <p className="mt-1 text-sm">
        This action cannot be performed during settlement lock period.
        Only authorized Director/Admin users can request unlock with a valid reason.
      </p>
    </div>
  )
}

export default LockedActionNotice
