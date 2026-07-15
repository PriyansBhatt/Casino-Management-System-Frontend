const SystemLockBanner = () => {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm">
      <p className="font-semibold">System Locked</p>
      <p className="mt-1 text-sm">
        System is currently locked for settlement. Transaction actions are disabled until
        the system is opened or unlocked by an authorized user.
      </p>
    </div>
  )
}

export default SystemLockBanner
