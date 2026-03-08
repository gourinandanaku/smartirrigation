import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// FR2: Auto control irrigation based on soil moisture thresholds and weather
export default function Irrigation() {
  const [searchParams] = useSearchParams()
  const plotId = searchParams.get('plot') || '1'
  const location = searchParams.get('location') || 'Unknown location'
  const plotName = searchParams.get('name') || 'Plot'
  
  const [autoOn, setAutoOn] = useState(true)
  const [thresholdLow, setThresholdLow] = useState(25)
  const [thresholdHigh, setThresholdHigh] = useState(65)
  const [currentMoisture] = useState(38)
  const [weatherConsidered] = useState(true) // from forecast

  const shouldIrrigate = autoOn && currentMoisture < thresholdLow && weatherConsidered

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Irrigation Control — {plotName || 'General'}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        {plotName ? `Plot ${plotId} (${location}) — ` : ''}Automatic irrigation based on soil moisture thresholds and weather forecast data.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800, marginTop: '1rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Status</h3>
          <p>
            Auto mode: <strong>{autoOn ? 'ON' : 'OFF'}</strong>
            <button
              onClick={() => setAutoOn(!autoOn)}
              style={{
                marginLeft: '1rem',
                padding: '0.35rem 0.75rem',
                background: autoOn ? 'var(--primary)' : 'var(--surface-hover)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {autoOn ? 'Disable' : 'Enable'}
            </button>
          </p>
          <p>Current soil moisture: <strong>{currentMoisture}%</strong></p>
          <p>Weather considered: {weatherConsidered ? 'Yes (no irrigation if rain predicted)' : 'No'}</p>
          {shouldIrrigate && (
            <p style={{ color: 'var(--accent)' }}>▶ Irrigation recommended (moisture below threshold)</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Thresholds</h3>
          <p>Trigger irrigation when soil moisture is below:</p>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Low threshold (%):{' '}
            <input
              type="number"
              min={10}
              max={50}
              value={thresholdLow}
              onChange={e => setThresholdLow(Number(e.target.value))}
              style={{ width: 60, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
            />
          </label>
          <label style={{ display: 'block' }}>
            High threshold (stop when above):{' '}
            <input
              type="number"
              min={50}
              max={90}
              value={thresholdHigh}
              onChange={e => setThresholdHigh(Number(e.target.value))}
              style={{ width: 60, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
