import { useMemo, useState } from 'react'
import { useMarketplace } from '../state/useMarketplace'
import CropCard from '../components/crops/CropCard'

export default function MarketplacePage() {
  const { crops, users, addToCart, currentUser } = useMarketplace()
  const [location, setLocation] = useState<string>('All')

  const locations = useMemo(() => {
    const set = new Set(crops.map((c) => c.location))
    return ['All', ...Array.from(set).sort()]
  }, [crops])

  const visibleCrops = useMemo(() => {
    const inStock = crops.filter((c) => c.quantityAvailable > 0)
    const byLocation = location === 'All' ? inStock : inStock.filter((c) => c.location === location)
    return byLocation
  }, [crops, location])

  function farmerNameForCrop(cropFarmerId: string) {
    return users.find((u) => u.id === cropFarmerId)?.name ?? 'Farmer'
  }

  return (
    <div className="section">
      <div className="split" style={{ gridTemplateColumns: '0.95fr 1.05fr' }}>
        <div>
          <h1>Marketplace</h1>
          <p>
            Browse locally available crops and add them to your cart. Demo session: <strong>{currentUser.name}</strong>
          </p>
        </div>

        <div className="form" style={{ padding: 12 }}>
          <div className="field">
            <label className="label" htmlFor="location-select">
              Location
            </label>
            <select
              id="location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <div className="muted" style={{ fontSize: 13 }}>
              Showing <strong>{visibleCrops.length}</strong> available crop{visibleCrops.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" role="list" aria-label="Crop listings">
        {visibleCrops.map((crop) => (
          <CropCard
            key={crop.id}
            crop={crop}
            farmerName={farmerNameForCrop(crop.farmerId)}
            onAddToCart={() => addToCart(crop.id, 1)}
          />
        ))}
      </div>

      {visibleCrops.length === 0 ? (
        <div className="form" style={{ textAlign: 'left' }}>
          <h2>No crops found</h2>
          <p>Try switching the location filter.</p>
        </div>
      ) : null}
    </div>
  )
}

