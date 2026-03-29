import { Outlet, NavLink } from 'react-router-dom'
import { useMarketplace } from '../marketplace/state/useMarketplace'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/disease', label: 'Disease Detection' },
  { to: '/dashboard/crops', label: 'Crop Details' },
  { to: '/dashboard/plots', label: 'Farm Plots' },
  { to: '/', label: 'Marketplace' },
]

export default function Layout() {
  const { currentUser, logout: contextLogout } = useMarketplace();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* SHARED TOPBAR */}
      <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>🌾 Smart Farm</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span className="pill" style={{ fontSize: '0.8rem' }}>👤 {currentUser.name}</span>
          <button 
            onClick={() => { contextLogout(); window.location.href = '/'; }} 
            className="btn btn--secondary" 
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{
          width: 220,
          background: 'var(--surface)',
          padding: '1rem 0',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <nav>
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '0.5rem 1rem',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(107,199,122,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  textDecoration: 'none'
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
