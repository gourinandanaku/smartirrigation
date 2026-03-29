import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMarketplace } from '../state/useMarketplace'
import { formatDate, formatMoney } from '../utils/format'

export default function FarmerDashboardPage() {
  const {
    currentUser,
    crops,
    addCropListing,
    updateCropStock,
    deleteCrop,
  } = useMarketplace()

  const myCrops = useMemo(
    () => crops.filter((c) => c.farmerId === currentUser.id),
    [crops, currentUser.id],
  )

  const [name, setName] = useState('')
  const [quantityAvailable, setQuantityAvailable] = useState<number>(0)
  const [pricePerKg, setPricePerKg] = useState<number>(0)
  const [harvestDate, setHarvestDate] = useState<string>('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string>('')

  const canAdd = currentUser.role === 'farmer'
  const isEditingAllowed = canAdd

  async function onPickImage(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

    setImageUrl(dataUrl)
    setImagePreview(dataUrl)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!isEditingAllowed) return
    addCropListing({
      name,
      quantityAvailable,
      pricePerKg,
      harvestDate,
      location,
      imageUrl: imageUrl || imagePreview,
    })
    setName('')
    setQuantityAvailable(0)
    setPricePerKg(0)
    setHarvestDate('')
    setLocation('')
    setImageUrl('')
    setImagePreview('')
  }

  if (currentUser.role !== 'farmer') {
    return (
      <div className="form" style={{ textAlign: 'left' }}>
        <h2>Farmer Dashboard</h2>
        <p>Switch to a Farmer role in the header to add and manage crop listings.</p>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="split">
        <div>
          <h1>Farmer Dashboard</h1>
          <p className="muted">Add crops, update stock, and manage your listings.</p>
        </div>
        <div className="pill">
          Signed in as <strong>{currentUser.name}</strong>
        </div>
      </div>

      <div className="split">
        <div className="form" style={{ textAlign: 'left' }}>
          <h2>Add Crop Listing</h2>
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="crop-name">
                  Crop name
                </label>
                <input id="crop-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="field">
                <label className="label" htmlFor="location">
                  Location
                </label>
                <input id="location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>

              <div className="field">
                <label className="label" htmlFor="quantity">
                  Quantity (kg)
                </label>
                <input
                  id="quantity"
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="price">
                  Price per kg (₹)
                </label>
                <input
                  id="price"
                  className="input"
                  type="number"
                  min={0}
                  step={0.01}
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(Number(e.target.value))}
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="harvest-date">
                  Harvest date
                </label>
                <input
                  id="harvest-date"
                  className="input"
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="image">
                  Image upload
                </label>
                <input
                  id="image"
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  required={!imagePreview}
                />
              </div>
            </div>

            {imagePreview ? (
              <div style={{ marginTop: 12 }}>
                <div className="label">Preview</div>
                <img
                  src={imagePreview}
                  alt="Crop preview"
                  style={{ width: '100%', maxWidth: 520, borderRadius: 14, border: '1px solid var(--border)' }}
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn btn--primary" type="submit">
                Add Listing
              </button>
            </div>
          </form>
        </div>

        <div className="form" style={{ textAlign: 'left' }}>
          <h2>Your Listed Crops</h2>
          {myCrops.length === 0 ? (
            <p className="muted">You haven’t added any listings yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myCrops.map((crop) => (
                <FarmerCropRow
                  key={crop.id}
                  crop={crop}
                  onUpdateStock={(next) => updateCropStock(crop.id, next)}
                  onDelete={() => {
                    const ok = window.confirm(`Delete "${crop.name}" listing?`)
                    if (ok) deleteCrop(crop.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FarmerCropRow({
  crop,
  onUpdateStock,
  onDelete,
}: {
  crop: { id: string; name: string; quantityAvailable: number; pricePerKg: number; harvestDate: string; location: string; imageUrl: string }
  onUpdateStock: (next: number) => void
  onDelete: () => void
}) {
  const [nextQty, setNextQty] = useState<number>(crop.quantityAvailable)

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <img
          src={crop.imageUrl}
          alt={crop.name}
          style={{ width: 80, height: 64, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 950, color: 'var(--heading)' }}>{crop.name}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {crop.location} · Harvest {formatDate(crop.harvestDate)} · ₹{formatMoney(crop.pricePerKg)}/kg
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Current stock: <strong style={{ color: 'var(--heading)' }}>{crop.quantityAvailable} kg</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 180 }}>
          <label className="label" htmlFor={`qty-${crop.id}`}>
            Update stock (kg)
          </label>
          <input
            id={`qty-${crop.id}`}
            type="number"
            min={0}
            step={1}
            className="input"
            value={nextQty}
            onChange={(e) => setNextQty(Number(e.target.value))}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn--primary"
              onClick={() => onUpdateStock(nextQty)}
              type="button"
            >
              Update
            </button>
            <button className="btn btn--danger" onClick={onDelete} type="button">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

