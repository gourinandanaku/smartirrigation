import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

L.Marker.prototype.options.icon = DefaultIcon

// Removed static crops array, now fetched from DB

// Flies map to searched location
function FlyToLocation({ coords }: { coords: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo(coords, 13)
  }, [coords, map])
  return null
}

// Map click handler
function LocationMarker({ setFormData, searchCoords }: any) {
  const [position, setPosition] = useState<[number, number] | null>(searchCoords || null)

  useEffect(() => {
    if (searchCoords) {
      setPosition(searchCoords)
      setFormData((prev: any) => ({
        ...prev,
        location: `${searchCoords[0].toFixed(5)}, ${searchCoords[1].toFixed(5)}`,
        latitude: searchCoords[0],
        longitude: searchCoords[1]
      }))
    }
  }, [searchCoords])

  useMapEvents({
    click(e: any) {
      const { lat, lng } = e.latlng
      const pos: [number, number] = [lat, lng]
      setPosition(pos)
      setFormData((prev: any) => ({
        ...prev,
        location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        latitude: lat,
        longitude: lng
      }))
    }
  })

  return position ? <Marker position={position} /> : null
}

// Address search bar
function MapSearch({ onResult }: { onResult: (coords: [number, number]) => void }) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError("")
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      if (data.length === 0) {
        setError("Location not found. Try a different name.")
      } else {
        const { lat, lon } = data[0]
        onResult([parseFloat(lat), parseFloat(lon)])
      }
    } catch {
      setError("Search failed. Check your connection.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          placeholder="Search location (e.g. Kerala, India)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: "8px 14px",
            background: "green",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap"
          }}
        >
          {searching ? "..." : "🔍 Search"}
        </button>
      </div>
      {error && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0" }}>{error}</p>}
    </div>
  )
}

type Plot = {
  _id: string
  name: string
  crop: string
  location: string
  latitude: number
  longitude: number
  deviceId: string
  startThreshold: number
  stopThreshold: number
}

export default function FarmPlots() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [crops, setCrops] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchCoords, setSearchCoords] = useState<[number, number] | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    crop: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    deviceId: "",
  })

  useEffect(() => {
    fetch("http://localhost:5000/api/plots")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlots(data.data || []);
        } else {
          console.error("Failed to fetch plots:", data.message);
        }
      })
      .catch(err => console.log(err))

    // Fetch crop names from both sources and merge
    const thresholdsPromise = fetch("http://localhost:5000/api/crop-thresholds")
      .then(res => res.json())
      .then(data => (data.success && data.data ? data.data.map((t: any) => t.cropName) : []))
      .catch(() => [])

    const marketplaceCropsPromise = fetch("http://localhost:5000/api/crops")
      .then(res => res.json())
      .then(data => {
        const list = data.data || data
        return Array.isArray(list) ? list.map((c: any) => c.name).filter(Boolean) : []
      })
      .catch(() => [])

    Promise.all([thresholdsPromise, marketplaceCropsPromise]).then(([thresholdNames, marketplaceNames]) => {
      const merged = Array.from(new Set([...thresholdNames, ...marketplaceNames])).sort()
      setCrops(merged)
    })
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Add plot → server auto-assigns crop thresholds
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.crop || !formData.location || !formData.deviceId) {
      alert("Please fill all fields")
      return
    }
    try {
      const res = await fetch("http://localhost:5000/api/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setPlots(prev => [...prev, data.data])
        setFormData({ name: "", crop: "", location: "", latitude: null, longitude: null, deviceId: "" })
        setSearchCoords(null)
        setShowForm(false)
      } else {
        alert(`Failed to add plot: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(error)
      alert("Failed to add plot due to network error")
    }
  }

  // Delete plot
  const deletePlot = async (id: string) => {
    if (!confirm("Delete this plot?")) return
    await fetch(`http://localhost:5000/api/plots/${id}`, { method: "DELETE" })
    setPlots(prev => prev.filter(plot => plot._id !== id))
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Farm Plots</h1>
      <p style={{ color: "gray" }}>Manage multiple plots; each has its own monitoring dashboard.</p>

      {/* Plot Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
        {plots.map((p) => (
          <div key={p._id} style={{ position: "relative", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
            <button
              onClick={() => deletePlot(p._id)}
              style={{ position: "absolute", top: 8, right: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: "20px" }}
            >×</button>
            <h3 style={{ margin: "0 0 0.5rem" }}>{p.name}</h3>
            <p style={{ margin: "0.2rem 0" }}>🌾 Crop: <strong>{p.crop}</strong></p>
            <p style={{ margin: "0.2rem 0" }}>📍 {p.location}</p>
            <p style={{ margin: "0.2rem 0" }}>📡 Device: <code>{p.deviceId}</code></p>
            <p style={{ margin: "0.2rem 0", fontSize: "0.85rem", color: "gray" }}>
              Thresholds: Start {p.startThreshold}% / Stop {p.stopThreshold}%
            </p>
            {/* 
              Dashboard link passes: plot id, deviceId, lat+lon coords, name
              SensorDashboard uses all of these to fetch sensor data, weather, and control pump
            */}
            <Link
              to={`/sensors?plot=${p._id}&device=${encodeURIComponent(p.deviceId)}&location=${encodeURIComponent(p.location)}&name=${encodeURIComponent(p.name)}`}
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "green",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none"
              }}
            >
              Open dashboard →
            </Link>
          </div>
        ))}
      </div>

      {/* Add Plot Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", border: "1px dashed green", borderRadius: "6px", cursor: "pointer" }}
      >
        + Add new plot
      </button>

      {/* Popup Form */}
      {showForm && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{ background: "white", padding: "2rem", borderRadius: "10px", width: "420px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Add New Plot</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text" name="name" placeholder="Plot Name" value={formData.name}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
              />
              <select
                name="crop" value={formData.crop} onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
              >
                <option value="">Select Crop</option>
                {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
              </select>

              <p style={{ margin: "0 0 6px", fontWeight: 500 }}>Select farm location on map</p>
              <MapSearch onResult={(coords) => setSearchCoords(coords)} />
              <p style={{ fontSize: "12px", color: "gray", margin: "0 0 6px" }}>
                Or click directly on the map to pin a location
              </p>

              <MapContainer
                center={[10.8505, 76.2711]}
                zoom={7}
                style={{ height: "280px", width: "100%", marginBottom: "10px" }}
              >
                <TileLayer
                  attribution="© OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker setFormData={setFormData} searchCoords={searchCoords} />
                <FlyToLocation coords={searchCoords} />
              </MapContainer>

              <input
                type="text" name="location" placeholder="Selected coordinates"
                value={formData.location} readOnly
                style={{ width: "100%", marginBottom: "10px", padding: "8px", background: "#f5f5f5", boxSizing: "border-box" }}
              />
              <input
                type="text" name="deviceId" placeholder="Device ID (e.g. ESP001)" value={formData.deviceId}
                onChange={handleFormChange}
                style={{ width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
              />

              <button
                type="submit"
                style={{ width: "100%", padding: "10px", background: "green", color: "white", border: "none", borderRadius: "6px" }}
              >
                Add Plot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}