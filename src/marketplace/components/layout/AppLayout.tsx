import { Outlet, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import FlashBanner from '../ui/FlashBanner'
import { useMarketplace } from '../../state/useMarketplace'
import { useState } from 'react'
import '../../styles/marketplace-theme.css'
import '../../styles/marketplace.css'

export default function AppLayout() {
  const { flash, dismissFlash, cartSubtotal, currentUser, logout: contextLogout } = useMarketplace()
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

        <div className="topbar__right" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="cart-summary">
            <span className="muted">Subtotal:</span>{' '}
            <strong>{cartSubtotal.toFixed(2)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentUser.id === 'guest' ? (
              <>
                <Link to="/login" className="btn btn--secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Login</Link>
                <Link to="/register" className="btn btn--primary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Register</Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className="pill" style={{ fontSize: '0.8rem' }}>👤 {currentUser.name}</span>
                <button 
                  className="btn btn--danger" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                  onClick={() => { contextLogout(); window.location.href = '/'; }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
