import { useState } from 'react'
import { Link } from 'react-router-dom'

// FR9: Farmers list agricultural products in the online marketplace
export default function MarketplaceList() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [quantity, setQuantity] = useState('')
  const [listed, setListed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !quantity) return
    setListed(true)
  }

  if (listed) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>Product listed</h1>
        <p style={{ color: 'var(--text-muted)' }}>Your product has been added to the marketplace. Buyers can browse and place orders.</p>
        <Link to="/marketplace" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Marketplace</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>List your product</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Add agricultural products to the marketplace. Buyers can browse and transact directly with you.
      </p>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 400, marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Product name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Organic Tomatoes"
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--primary-dim)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Price per unit (₹)
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            min={1}
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--primary-dim)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Unit
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--primary-dim)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="kg">kg</option>
            <option value="quintal">Quintal</option>
            <option value="ton">Ton</option>
            <option value="bag">Bag</option>
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Quantity available
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
            min={1}
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--primary-dim)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600 }}
          >
            List product
          </button>
          <Link to="/marketplace" style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}
