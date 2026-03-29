import { useState } from 'react'
import { Link } from 'react-router-dom'

// FR9–FR10: Farmers list products; buyers browse, place orders, direct transactions
const mockProducts = [
  { id: '1', name: 'Organic Tomatoes', farmer: 'Green Valley Farm', price: 80, unit: 'kg', location: 'District A' },
  { id: '2', name: 'Wheat grain', farmer: 'North Fields', price: 25, unit: 'kg', location: 'District B' },
  { id: '3', name: 'Basmati Rice', farmer: 'Paddy Co', price: 120, unit: 'kg', location: 'District A' },
]

export default function Marketplace() {
  const [query, setQuery] = useState('')

  const filtered = mockProducts.filter(
    p => p.name.toLowerCase().includes(query.toLowerCase()) || p.farmer.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Marketplace</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Browse products, place orders, and transact directly with farmers.
      </p>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search products or farmer..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--primary-dim)',
            background: 'var(--surface)',
            color: 'var(--text)',
            minWidth: 260,
          }}
        />
        <Link
          to="/marketplace/list"
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary)',
            color: 'white',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          List your product (Farmer)
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {filtered.map(p => (
          <div key={p.id} className="card">
            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0' }}>{p.farmer} · {p.location}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{p.price}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/{p.unit}</span></p>
            <button
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Place order
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
