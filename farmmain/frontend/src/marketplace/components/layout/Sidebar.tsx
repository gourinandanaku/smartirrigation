import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useMarketplace } from '../../state/useMarketplace'

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
  const { currentUser } = useMarketplace();
  const isAdmin = currentUser.role === 'admin';
  const isFarmer = currentUser.role === 'farmer';

  return (
    <aside className="sidebar">
      <nav className="nav" aria-label="Marketplace navigation" onClick={() => onNavigate?.()}>
        <NavItem to="/" end>
          Marketplace
        </NavItem>
        <NavItem to="/cart">Cart</NavItem>

        {/* Farmer & Admin only */}
        {(isAdmin || isFarmer) && (
          <>
            <NavItem to="/dashboard">Farmer Dashboard</NavItem>
            <NavItem to="/farmer">Sell Crops</NavItem>
          </>
        )}

        <NavItem to="/orders">Orders</NavItem>

        {/* Admin only */}
        {isAdmin && (
          <NavItem to="/admin">Admin Dashboard</NavItem>
        )}
      </nav>
    </aside>
  )
}
