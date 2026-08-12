import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuth from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { getDefaultRouteForRole } from '../../utils/accessControl'

const testCredentials = [
  ['Admin', 'admin', 'admin123'],
  ['Director', 'director', 'director123'],
  ['Cashier', 'cashier', 'cashier123'],
  ['Reception', 'reception', 'reception123'],
  ['Pit Boss', 'pitboss', 'pitboss123'],
  ['Store', 'store', 'store123'],
  ['Procurement', 'procurement', 'procurement123'],
  ['Accounts', 'accounts', 'accounts123'],
  ['Department Head', 'department', 'department123'],
  ['Auditor', 'auditor', 'auditor123'],
]

const Login = () => {
  const navigate = useNavigate()
  const { user, login, isAuthenticated, loading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(getDefaultRouteForRole(user?.role), { replace: true })
    return null
  }

  const onSubmit = async (data) => {
    setError('')
    setIsLoading(true)

    try {
      const result = await login(data)

      if (result.success) {
        navigate(getDefaultRouteForRole(result.user?.role), { replace: true })
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Casino Management System</h1>
            <p className="text-gray-600 text-lg">Secure Staff Login</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username Input */}
            <Input
              label="Username"
              placeholder="Enter your username"
              {...register('username', {
                required: 'Username is required',
              })}
              error={errors.username?.message}
              disabled={isLoading}
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
              })}
              error={errors.password?.message}
              disabled={isLoading}
            />

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Test Credentials Hint */}
            {useMockAuth && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="mb-3 text-sm font-semibold text-blue-800">
                  Test Credentials (Mock Auth)
                </p>
                <div className="grid gap-1.5 text-xs text-blue-700">
                  {testCredentials.map(([label, username, password]) => (
                    <div key={username} className="flex items-center justify-between gap-3">
                      <span className="font-medium">{label}</span>
                      <span className="font-mono">
                        {username} / {password}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full font-semibold py-3 text-base"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              {useMockAuth ? (
                <span>Using mock authentication for development</span>
              ) : (
                <span>Please contact your administrator for access</span>
              )}
            </p>
          </div>
        </Card>

        {/* Version Info */}
        <div className="mt-8 text-center text-white text-sm opacity-75">
          <p>Casino Management System v1.0.0 - Phase 2</p>
        </div>
      </div>
    </div>
  )
}

export default Login
