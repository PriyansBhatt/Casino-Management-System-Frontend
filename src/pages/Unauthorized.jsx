import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import useAuth from '../hooks/useAuth'

const Unauthorized = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Access Denied</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-3 text-gray-600">
          Your current role does not have permission to access this page.
        </p>
        <div className="mt-6 rounded-md bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">Current Role</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{user?.role || 'No Role'}</p>
        </div>
        <Button className="mt-6" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  )
}

export default Unauthorized
