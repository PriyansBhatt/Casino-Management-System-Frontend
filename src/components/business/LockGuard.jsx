import Card from '../ui/Card'
import useBusinessStatus from '../../hooks/useBusinessStatus'

const LockGuard = ({ children, fallback, allowedWhenLocked = false }) => {
  const { isSystemLocked } = useBusinessStatus()

  if (isSystemLocked && !allowedWhenLocked) {
    if (fallback) {
      return fallback
    }

    return (
      <Card className="border-amber-200 bg-amber-50 text-amber-900">
        <p className="font-semibold">System is locked.</p>
        <p className="mt-1 text-sm">
          This action is disabled during settlement period.
        </p>
      </Card>
    )
  }

  return children
}

export default LockGuard
