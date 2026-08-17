import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { BusinessStatusProvider } from './context/BusinessStatusContext'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <AuthProvider>
      <BusinessStatusProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BusinessStatusProvider>
    </AuthProvider>
  )
}

export default App
