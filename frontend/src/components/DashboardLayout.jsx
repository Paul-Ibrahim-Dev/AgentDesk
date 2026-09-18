import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import Logo from './Logo';

const navItems = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/profile', label: 'Business Profile' },
  { to: '/dashboard/services', label: 'Services' },
  { to: '/dashboard/faqs', label: 'FAQs' },
  { to: '/dashboard/agent', label: 'AI Agent' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/conversations', label: 'Conversations' },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { businesses, loading, activeBusiness, activeBusinessId, setActiveBusinessId } = useBusiness();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-ink-900 text-paper/50">Loading your workspace...</div>;
  }

  // No business yet -> onboarding flow, except the create-business page itself.
  if (!loading && businesses.length === 0 && location.pathname !== '/dashboard/new-business') {
    return <Navigate to="/dashboard/new-business" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden md:flex w-64 flex-col bg-ink-900 border-r border-ink-700">
        <div className="h-16 flex items-center px-5 border-b border-ink-700">
          <Logo />
        </div>

        {businesses.length > 1 && (
          <div className="px-4 py-3 border-b border-ink-700">
            <label className="label-dark">Business</label>
            <select
              className="input-dark"
              value={activeBusinessId || ''}
              onChange={(e) => setActiveBusinessId(e.target.value)}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink-800 text-signal-400' : 'text-paper/55 hover:bg-ink-800 hover:text-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-700 p-4">
          <p className="truncate text-xs text-paper/35 mb-2">{user?.email}</p>
          <button type="button" className="btn-secondary w-full" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4">
          <Logo />
          <button type="button" className="btn-ghost text-sm" onClick={() => signOut()}>
            Log out
          </button>
        </header>

        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <h1 className="text-sm font-medium text-gray-500">
            {activeBusiness ? activeBusiness.name : 'AgentDesk'}
          </h1>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
