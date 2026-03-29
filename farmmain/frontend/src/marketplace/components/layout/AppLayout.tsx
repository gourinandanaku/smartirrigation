import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import RoleSwitcher from './RoleSwitcher'
import FlashBanner from '../ui/FlashBanner'
import { useMarketplace } from '../../state/useMarketplace'
import { useState } from 'react'
import '../../styles/marketplace-theme.css'
import '../../styles/marketplace.css'

export default function AppLayout() {
  const { flash, dismissFlash, cartSubtotal } = useMarketplace()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="app-shell">
      <FlashBanner flash={flash} onDismiss={dismissFlash} />

      <header className="topbar">
        <div className="topbar__left">
          <button
            className="topbar__menu"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          <div className="brand" aria-label="Smart Farm">
            <span className="brand__title" style={{ fontWeight: 700, fontSize: '1.1rem' }}>🌾 Smart Farm</span>
          </div>
        </div>

        <div className="topbar__right">
          <div className="cart-summary">
            <span className="muted">Subtotal:</span>{' '}
            <strong>{cartSubtotal.toFixed(2)}</strong>
          </div>

          <RoleSwitcher />
        </div>
      </header>

      <div className="app-body">
        <div className={`sidebar-wrap ${mobileNavOpen ? 'sidebar-wrap--open' : ''}`}>
          <Sidebar onNavigate={() => setMobileNavOpen(false)} />
        </div>

        <main className="main">
          <div className="page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

