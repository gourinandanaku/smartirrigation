import { MapContainer, TileLayer } from "react-leaflet"

export default function TestMap() {
  return (
    <MapContainer
      center={[10.8505, 76.2711]}
      zoom={7}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}