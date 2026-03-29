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
        <NavItem to="/marketplace" end>
          Marketplace
        </NavItem>
        <NavItem to="/marketplace/cart">Cart</NavItem>
        <NavItem to="/marketplace/farmer">Farmer Dashboard</NavItem>
        <NavItem to="/marketplace/orders">Orders</NavItem>
        <NavItem to="/marketplace/admin">Admin Dashboard</NavItem>
      </nav>
    </aside>
  )
}

