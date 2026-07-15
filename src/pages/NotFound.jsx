import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mt-3 text-gray-600">The page you are looking for does not exist.</p>
        <Button className="mt-6" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  )
}

export default NotFound
