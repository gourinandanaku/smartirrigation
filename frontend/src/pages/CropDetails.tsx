import { useState } from 'react'

// FR5: Crop-specific details — optimal soil moisture, temperature, fertilizer, growth duration
const crops: Record<string, { moisture: string; temp: string; fertilizer: string; duration: string }> = {
  Rice: { moisture: '60–80%', temp: '20–37°C', fertilizer: 'N-P-K 40-20-20, split at tillering & panicle', duration: '90–150 days' },
  Wheat: { moisture: '40–60%', temp: '15–25°C', fertilizer: 'N-P-K 60-40-20, top-dress at tillering', duration: '110–130 days' },
  Tomato: { moisture: '50–70%', temp: '18–28°C', fertilizer: 'Balanced 19-19-19, add Ca to prevent blossom end rot', duration: '70–90 days' },
  Cotton: { moisture: '45–65%', temp: '21–30°C', fertilizer: 'N-P-K 80-40-40, avoid excess N late', duration: '150–180 days' },
  Sugarcane: { moisture: '55–75%', temp: '25–32°C', fertilizer: 'Heavy N (200+ kg/ha), P at planting', duration: '10–18 months' },
  Maize: { moisture: '50–70%', temp: '21–30°C', fertilizer: 'N-P-K 120-60-40, side-dress at knee-high', duration: '80–110 days' },
}

export default function CropDetails() {
  const [selected, setSelected] = useState<string>('Tomato')
  const crop = crops[selected]!

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Crop-specific Details</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Optimal soil moisture range, temperature requirements, fertilizer suggestions, and growth duration.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <div className="card" style={{ minWidth: 200 }}>
          <h3 style={{ marginTop: 0 }}>Select crop</h3>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 6,
              border: '1px solid var(--primary-dim)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          >
            {Object.keys(crops).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ marginTop: 0 }}>{selected}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '0.35rem 0', color: 'var(--text-muted)' }}>Optimal soil moisture</td><td><strong>{crop.moisture}</strong></td></tr>
              <tr><td style={{ padding: '0.35rem 0', color: 'var(--text-muted)' }}>Temperature range</td><td><strong>{crop.temp}</strong></td></tr>
              <tr><td style={{ padding: '0.35rem 0', color: 'var(--text-muted)' }}>Fertilizer suggestion</td><td><strong>{crop.fertilizer}</strong></td></tr>
              <tr><td style={{ padding: '0.35rem 0', color: 'var(--text-muted)' }}>Growth duration</td><td><strong>{crop.duration}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
