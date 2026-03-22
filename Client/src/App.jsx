import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import CreateTrip from './pages/CreateTrip'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TripDetails from './pages/TripDetails'
import ForgotPassword from './pages/ForgotPassword'

function App() {
  const { token } = useAuth()

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(253,160,85,0.12),transparent_26%),radial-gradient(circle_at_95%_0%,rgba(1,45,29,0.12),transparent_34%)]" />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-7 lg:px-8">
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-trip"
            element={
              <ProtectedRoute>
                <CreateTrip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip/:id"
            element={
              <ProtectedRoute>
                <TripDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
