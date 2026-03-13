import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="text-lg font-bold tracking-tight text-brand-700">
          🗺️ Smart Itinerary Planner
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">Hi, {user?.name || 'Traveler'}</span>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/create-trip"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Create Trip
              </NavLink>
              <NavLink
                to="/optimize-route"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Route Optimizer
              </NavLink>
              <NavLink
                to="/ml-model"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-violet-100 text-violet-700' : 'text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                🧠 ML Model
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/optimize-route"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Route Optimizer
              </NavLink>
              <NavLink
                to="/ml-model"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-violet-100 text-violet-700' : 'text-violet-600 hover:bg-violet-50'
                  }`
                }
              >
                🧠 ML Model
              </NavLink>
              <NavLink to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Signup
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
