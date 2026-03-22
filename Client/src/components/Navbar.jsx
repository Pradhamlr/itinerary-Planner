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
    <header className="sticky top-0 z-20 backdrop-blur">
      <div className="mx-auto mt-4 flex w-[min(96%,980px)] items-center justify-between rounded-2xl bg-brand-surfaceLow/90 px-4 py-4 shadow-soft sm:px-6">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="editorial-title text-xl font-semibold text-brand-palm">
          Kerala Itinerary Planner
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-brand-secondary sm:inline">Hi, {user?.name || 'Traveler'}</span>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-surfaceHigh text-brand-palm' : 'text-brand-palm hover:bg-brand-surfaceHigh/70'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/create-trip"
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-surfaceHigh text-brand-palm' : 'text-brand-palm hover:bg-brand-surfaceHigh/70'
                  }`
                }
              >
                Create Trip
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-brand-palm px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3a28]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-palm hover:bg-brand-surfaceHigh/70">
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-xl bg-brand-terracotta px-4 py-2 text-sm font-semibold text-brand-terracottaInk transition hover:bg-[#f1913e]"
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
