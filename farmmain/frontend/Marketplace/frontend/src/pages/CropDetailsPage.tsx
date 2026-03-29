import { Link, useParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useMarketplace } from '../state/useMarketplace'
import { formatDate, formatMoney } from '../utils/format'

export default function CropDetailsPage() {
  const { id } = useParams()
  const { crops, users, addToCart } = useMarketplace()

  const crop = useMemo(() => crops.find((c) => c.id === id), [crops, id])

  if (!id || !crop) {
    return (
      <div className="form" style={{ textAlign: 'left' }}>
        <h2>Crop not found</h2>
        <p>Please return to the marketplace.</p>
        <Link to="/" className="btn btn--primary">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const farmerName = users.find((u) => u.id === crop.farmerId)?.name ?? 'Farmer'
  const inStock = crop.quantityAvailable > 0

  return (
    <div className="section">
      <div className="split">
        <div className="card" style={{ overflow: 'hidden' }}>
          <img className="card__image" src={crop.imageUrl} alt={crop.name} style={{ height: 320 }} />
          <div className="card__body">
            <h1 style={{ margin: 0 }}>{crop.name}</h1>
            <div className="meta-row">
              <span className="muted">Price</span>
              <strong>${formatMoney(crop.pricePerKg)}/kg</strong>
            </div>
            <div className="meta-row">
              <span className="muted">Available</span>
              <strong>{crop.quantityAvailable} kg</strong>
            </div>
            <div className="meta-row">
              <span className="muted">Harvest date</span>
              <strong>{formatDate(crop.harvestDate)}</strong>
            </div>
            <div className="meta-row">
              <span className="muted">Location</span>
              <strong>{crop.location}</strong>
            </div>
            <div className="meta-row">
              <span className="muted">Farmer</span>
              <strong>{farmerName}</strong>
            </div>
          </div>
        </div>

        <div className="form" style={{ textAlign: 'left' }}>
          <h2>Buy Crop</h2>
          <p className="muted">
            Add this crop to your cart to place an order directly with the farmer.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              className="btn btn--primary"
              onClick={() => addToCart(crop.id, 1)}
              disabled={!inStock}
            >
              Add to Cart
            </button>
            <Link to="/" className="btn">
              Continue Shopping
            </Link>
          </div>

          {!inStock ? (
            <div style={{ marginTop: 12 }} className="pill">
              Out of stock
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

