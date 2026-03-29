import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../state/useMarketplace'
import { formatMoney } from '../utils/format'

export default function CartPage() {
  const {
    cart,
    crops,
    removeFromCart,
    updateCartItemQuantity,
    placeOrderFromCart,
    cartSubtotal,
    cartCount,
    currentUser,
  } = useMarketplace()

  const items = useMemo(() => {
    const byId = new Map(crops.map((c) => [c.id, c]))
    return cart
      .map((item) => {
        const crop = byId.get(item.cropId)
        if (!crop) return null
        return { crop, quantity: item.quantity }
      })
      .filter(Boolean) as { crop: typeof crops[number]; quantity: number }[]
  }, [cart, crops])

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD')
  const [placedOrder, setPlacedOrder] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleCheckout() {
    setIsProcessing(true)
    try {
      const order = await placeOrderFromCart(paymentMethod)
      setPlacedOrder(order)
    } finally {
      setIsProcessing(false)
    }
  }

  if (placedOrder) {
    return (
      <div className="section">
        <div className="form" style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
          <h2>🎉 Order Confirmed!</h2>
          <p className="muted">Your Smart Farm order has been successfully placed.</p>
          <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 10, marginTop: 16 }}>
            <p><strong>Order ID:</strong> {placedOrder._id}</p>
            <p><strong>Total Paid:</strong> ₹{formatMoney(placedOrder.totalAmount)}</p>
            <p><strong>Payment Method:</strong> {placedOrder.paymentMethod}</p>
            <p>
               <strong>Payment Status:</strong> 
               <span className={`badge ${placedOrder.paymentStatus === 'completed' ? 'badge--success' : 'badge--warning'}`} style={{ marginLeft: 8 }}>
                 {placedOrder.paymentStatus.toUpperCase()}
               </span>
            </p>
            <p><strong>Order Status:</strong> {placedOrder.orderStatus}</p>
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn--primary" onClick={() => setPlacedOrder(null)}>Continue Shopping</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="split">
        <div>
          <h1>Cart</h1>
          <p className="muted">Direct purchasing from farmers. Update quantities before ordering.</p>
        </div>
        <div className="form" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="label">Items</div>
              <div style={{ fontWeight: 900, color: 'var(--heading)' }}>{cartCount}</div>
            </div>
            <div>
              <div className="label">Subtotal</div>
              <div style={{ fontWeight: 900, color: 'var(--heading)' }}>₹{formatMoney(cartSubtotal)}</div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 8, marginTop: 14 }}>
            <div className="label" style={{ marginBottom: 8 }}>Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={paymentMethod === 'COD'} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)} 
                />
                Cash on Delivery (COD)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="ONLINE" 
                  checked={paymentMethod === 'ONLINE'} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)} 
                />
                Online Payment (Simulated)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button 
               className="btn btn--primary" 
               onClick={handleCheckout} 
               disabled={items.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing Payment...' : 'Place Order'}
            </button>
            <Link to="/marketplace" className="btn">
              Continue shopping
            </Link>
          </div>

          {currentUser.role !== 'buyer' ? (
            <div style={{ marginTop: 12 }} className="pill">
              Only buyers can place orders (switch role in the header).
            </div>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="form" style={{ textAlign: 'left' }}>
          <h2>Your cart is empty</h2>
          <p>Browse crops in the marketplace and add them to your cart.</p>
          <Link to="/marketplace" className="btn btn--primary">
            Go to Marketplace
          </Link>
        </div>
      ) : (
        <div className="form" style={{ textAlign: 'left' }}>
          <table className="table" aria-label="Cart items">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Quantity (kg)</th>
                <th>Price</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(({ crop, quantity }) => (
                <tr key={crop.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img
                        src={crop.imageUrl}
                        alt={crop.name}
                        style={{ width: 54, height: 44, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 900, color: 'var(--heading)' }}>{crop.name}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {crop.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <input
                      className="input"
                      style={{ width: 120 }}
                      type="number"
                      min={0}
                      max={crop.quantityAvailable}
                      value={quantity}
                      onChange={(e) => updateCartItemQuantity(crop.id, Number(e.target.value))}
                    />
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      In stock: {crop.quantityAvailable} kg
                    </div>
                  </td>
                  <td>₹{formatMoney(crop.pricePerKg)}/kg</td>
                  <td style={{ fontWeight: 900 }}>₹{formatMoney(crop.pricePerKg * quantity)}</td>
                  <td>
                    <button className="btn btn--danger" onClick={() => removeFromCart(crop.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

