import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type NavItemProps = {
  to: string
  children: ReactNode
  badge?: number
  end?: boolean
}

function NavItem({ to, children, badge, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
    >
      <span>{children}</span>
      {typeof badge === 'number' && badge > 0 ? (
        <span className="nav-badge" aria-label={`${badge} items`}>{badge}</span>
      ) : null}
    </NavLink>
  )
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="sidebar">
      <nav className="nav" aria-label="Marketplace navigation" onClick={() => onNavigate?.()}>
        <NavItem to="/" end>
          Marketplace
        </NavItem>
        <NavItem to="/cart">Cart</NavItem>
        <NavItem to="/farmer">Farmer Dashboard</NavItem>
        <NavItem to="/orders">Orders</NavItem>
        <NavItem to="/admin">Admin Dashboard</NavItem>
      </nav>
    </aside>
  )
}

