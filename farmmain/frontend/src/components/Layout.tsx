import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/disease', label: 'Disease Detection' },
  { to: '/crops', label: 'Crop Details' },
  { to: '/plots', label: 'Farm Plots' },
  { to: '/marketplace', label: 'Marketplace' },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220,
        background: 'var(--surface)',
        padding: '1rem 0',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ padding: '0 1rem 1rem', fontWeight: 700, fontSize: '1.1rem' }}>
          🌾 Smart Farm
        </div>
        <nav>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '0.5rem 1rem',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'rgba(107,199,122,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
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
  )
}
