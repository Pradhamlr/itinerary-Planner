import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4.5v-6h3V21H18a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

function Navbar() {
  const { isAuthenticated } = useAuth()

  const navLinkClass = ({ isActive }) =>
    `border-b-2 pb-2 text-sm font-medium transition ${
      isActive ? 'border-brand-secondary text-brand-secondary' : 'border-transparent text-brand-onSurfaceVariant hover:text-brand-palm'
    }`

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/82 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="editorial-title text-2xl font-semibold text-brand-palm">
            Voyager
          </Link>

          {isAuthenticated ? (
            <nav className="hidden items-center gap-6 md:flex">
              <NavLink to="/dashboard" className={navLinkClass}>Explore</NavLink>
              <NavLink to="/route-optimizer" className={navLinkClass}>Route Optimizer</NavLink>
              <NavLink to="/documents" className={navLinkClass}>Documents</NavLink>
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-surfaceHigh text-brand-palm transition hover:bg-[#dfe4e8]"
              aria-label="Home"
              title="Home"
            >
              <HomeIcon />
            </Link>
          ) : (
            <>
              <NavLink to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-brand-onSurfaceVariant transition hover:bg-brand-surfaceLow">
                Login
              </NavLink>
              <NavLink to="/signup" className="btn-primary px-5 py-2.5">
                Get Started
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
