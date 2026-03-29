import { Link } from 'react-router-dom'
import type { Crop } from '../../data/types'
import { formatDate, formatMoney } from '../../utils/format'

export default function CropCard({
  crop,
  farmerName,
  onAddToCart,
}: {
  crop: Crop
  farmerName: string
  onAddToCart: () => void
}) {
  const inStock = crop.quantityAvailable > 0

  return (
    <div className="card" aria-label={`Crop: ${crop.name}`}>
      <img className="card__image" src={crop.imageUrl} alt={crop.name} />
      <div className="card__body">
        <h3 className="card__title">{crop.name}</h3>

        <div className="meta-row">
          <span className="muted">Price</span>
          <strong>₹{formatMoney(crop.pricePerKg)}/kg</strong>
        </div>
        <div className="meta-row">
          <span className="muted">Available</span>
          <strong>{crop.quantityAvailable} kg</strong>
        </div>
        <div className="meta-row">
          <span className="muted">Location</span>
          <strong>{crop.location}</strong>
        </div>
        <div className="meta-row">
          <span className="muted">Harvest</span>
          <strong>{formatDate(crop.harvestDate)}</strong>
        </div>
        <div className="meta-row">
          <span className="muted">Farmer</span>
          <strong>{farmerName}</strong>
        </div>

        <div className="btn-row">
          <Link className="btn btn--primary btn-linklike" to={`/crops/${crop.id}`}>
            View Details
          </Link>
          <button className="btn" onClick={onAddToCart} disabled={!inStock} title={!inStock ? 'Out of stock' : 'Add to cart'}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

