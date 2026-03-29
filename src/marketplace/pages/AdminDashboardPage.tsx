import { useMemo } from 'react'
import { useMarketplace } from '../state/useMarketplace'
import { formatDate, formatMoney } from '../utils/format'

export default function AdminDashboardPage() {
  const { currentUser, users, crops, orders, deleteCrop } = useMarketplace()

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users])

  if (currentUser.role !== 'admin') {
    return (
      <div className="form" style={{ textAlign: 'left' }}>
        <h2>Admin Dashboard</h2>
        <p>Switch to an Admin role in the header to manage marketplace data.</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="split">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Manage crops, users, and view order history.</p>
        </div>
        <div className="pill">
          Admin: <strong>{currentUser.name}</strong>
        </div>
      </div>

      <div className="split" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
        <div className="form" style={{ textAlign: 'left' }}>
          <h2>All Crops</h2>
          {crops.length === 0 ? (
            <p className="muted">No crop listings available.</p>
          ) : (
            <table className="table" aria-label="All crops table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Farmer</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Location</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {crops.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 900, color: 'var(--heading)' }}>{c.name}</td>
                    <td>{usersById.get(c.farmerId) ?? 'Farmer'}</td>
                    <td>${formatMoney(c.pricePerKg)}/kg</td>
                    <td>{c.quantityAvailable}</td>
                    <td>{c.location}</td>
                    <td>
                      <button
                        className="btn btn--danger"
                        onClick={() => {
                          const ok = window.confirm(`Delete "${c.name}" listing?`)
                          if (ok) deleteCrop(c.id)
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form" style={{ textAlign: 'left' }}>
          <h2>All Users</h2>
          <p className="muted">No user data available.</p>

          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            Tip: switch role from the header to test each dashboard.
          </div>
        </div>
      </div>

      <div className="form" style={{ textAlign: 'left' }}>
        <h2>All Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders placed yet.</p>
        ) : (
          <table className="table" aria-label="All orders table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Farmer</th>
                <th>Buyer</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 900, color: 'var(--heading)' }}>{o.cropName}</td>
                  <td>{o.farmerName}</td>
                  <td>{usersById.get(o.buyerId) ?? o.buyerId}</td>
                  <td>{o.quantity}</td>
                  <td>{o.status}</td>
                  <td className="muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

