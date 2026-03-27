import { Link } from 'react-router-dom'

const quickLinks = [
  { to: '/disease', label: 'Disease detection', desc: 'Upload leaf images for AI analysis' },
  { to: '/crops', label: 'Crop details', desc: 'Optimal ranges & fertilizer suggestions' },
  { to: '/plots', label: 'Farm plots', desc: 'Multiple plots, separate dashboards' },
  { to: '/marketplace', label: 'Marketplace', desc: 'List & buy products' },
]

export default function Dashboard() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Monitor your farm, control irrigation, and manage marketplace from one place.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem',
      }}>
        {quickLinks.map(({ to, label, desc }) => (
          <Link
            key={to}
            to={to}
            style={{
              display: 'block',
              padding: '1.25rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              color: 'inherit',
              textDecoration: 'none',
              boxShadow: 'var(--shadow)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--surface-hover)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--surface)'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.35rem' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
