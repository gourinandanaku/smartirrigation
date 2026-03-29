import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useMarketplace } from '../state/useMarketplace'
import { formatDate } from '../utils/format'

export default function OrdersPage() {
  const { orders, currentUser } = useMarketplace()

  const myOrders = useMemo(() => {
    if (currentUser.role !== 'buyer') return []
    return orders.filter((o) => o.buyerId === currentUser.id)
  }, [orders, currentUser.id, currentUser.role])

  if (currentUser.role === 'admin') {
    return (
      <div className="form" style={{ textAlign: 'left' }}>
        <h2>Orders</h2>
        <p>You can view all orders in the Admin Dashboard.</p>
        <Link to="/admin" className="btn btn--primary">
          Go to Admin Dashboard
        </Link>
      </div>
    )
  }

  if (currentUser.role !== 'buyer') {
    return (
      <div className="form" style={{ textAlign: 'left' }}>
        <h2>Orders</h2>
        <p>Only buyers can view their placed orders.</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="split">
        <div>
          <h1>Orders</h1>
          <p className="muted">Track your purchases. Each line item shows status.</p>
        </div>
        <div className="pill">
          Buyer: <strong>{currentUser.name}</strong>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="form" style={{ textAlign: 'left' }}>
          <h2>No orders yet</h2>
          <p>Browse crops in the marketplace and place your first order.</p>
        </div>
      ) : (
        <div className="form" style={{ textAlign: 'left' }}>
          <table className="table" aria-label="Orders table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Farmer</th>
                <th>Quantity (kg)</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 900, color: 'var(--heading)' }}>{o.cropName}</td>
                  <td>{o.farmerName}</td>
                  <td>{o.quantity}</td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background:
                          o.status === 'Placed'
                            ? 'rgba(46, 125, 50, 0.10)'
                            : o.status === 'Cancelled'
                              ? 'rgba(180, 35, 24, 0.08)'
                              : 'rgba(35, 85, 50, 0.06)',
                        borderColor: 'rgba(35, 85, 50, 0.18)',
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

