import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Irrigation() {
  const [searchParams] = useSearchParams()
  const plotId   = searchParams.get('plot')     || ''
  const location = searchParams.get('location') || 'Unknown location'
  const plotName = searchParams.get('name')     || 'Plot'
  const deviceId = searchParams.get('device')   || ''

  // ── Pump state ────────────────────────────────────────────────────────────
  // FIX: pumpStatus ഇനി ESP32 actual relay state ആണ്
  // sensor poll-ൽ നിന്ന് pumpRunning field read ചെയ്യുന്നു
  const [pumpStatus, setPumpStatus] = useState<'ON' | 'OFF'>('OFF')

  // ── Thresholds ────────────────────────────────────────────────────────────
  const [thresholdLow, setThresholdLow]   = useState(40)
  const [thresholdHigh, setThresholdHigh] = useState(70)
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [thresholdSaved, setThresholdSaved]   = useState(false)

  // ── Live sensor moisture (polls every 5s) ─────────────────────────────────
  const [currentMoisture, setCurrentMoisture] = useState<number | null>(null)
  const [sensorError, setSensorError]         = useState<string | null>(null)

  // ── Weather rain check ────────────────────────────────────────────────────
  const [rainWarning, setRainWarning] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // 1. Load thresholds on mount
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    fetch(`http://localhost:5000/api/threshold/${deviceId}`)
      .then(res => res.json())
      .then(data => {
        setThresholdLow(data.start)
        setThresholdHigh(data.stop)
      })
      .catch(() => {})
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Poll live sensor data every 5s
  //    FIX: pumpRunning field-ൽ നിന്ന് ESP32 actual relay state read ചെയ്യുന്നു
  //    Dashboard button state അല്ല — ESP32 actually relay ON/OFF ചെയ്‌തതാണ്
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    const fetchSensor = async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/sensor/${deviceId}`)
        const data = await res.json()
        const latest = Array.isArray(data) ? data[0] : data
        if (latest) {
          setCurrentMoisture(Number(latest.soilMoisture ?? 0))
          // ESP32 actual relay state — 5s delay ഉണ്ടാകും
          setPumpStatus(latest.pumpRunning ? 'ON' : 'OFF')
        }
        setSensorError(null)
      } catch {
        setSensorError('Could not reach sensor')
      }
    }

    fetchSensor()
    const t = setInterval(fetchSensor, 5000)
    return () => clearInterval(t)
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Weather rain check
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!location || location === 'Unknown location') return

    const [lat, lon] = location.split(',').map(s => s.trim())
    if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) return

    fetch(`http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        const items = (data.list || []).slice(0, 5)
        const hasRain = items.some((e: any) => (e.pop ?? 0) > 0.5)
        setRainWarning(hasRain)
      })
      .catch(() => {})
  }, [location])

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════════

  const sendPumpCommand = async (status: 'ON' | 'OFF') => {
    if (!deviceId) return
    try {
      await fetch('http://localhost:5000/api/pump', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId, status })
      })
      // ഉടനെ optimistic update — 5s-ൽ sensor poll actual state overwrite ചെയ്യും
      setPumpStatus(status)
    } catch {
      alert('Failed to send pump command')
    }
  }

  const saveThresholds = async () => {
    if (!deviceId) return
    try {
      setSavingThreshold(true)
      const res = await fetch(`http://localhost:5000/api/threshold/${deviceId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ start: thresholdLow, stop: thresholdHigh })
      })
      if (!res.ok) {
        alert('Failed to save thresholds — server error')
        return
      }
      const data = await res.json()
      setThresholdLow(data.start)
      setThresholdHigh(data.stop)
      setThresholdSaved(true)
      setTimeout(() => setThresholdSaved(false), 2000)
    } catch {
      alert('Failed to save thresholds')
    } finally {
      setSavingThreshold(false)
    }
  }

  const moisture = currentMoisture ?? 0

  if (!deviceId) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        ⚠️ Device ID missing. Open irrigation from a plot card link.
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Irrigation Control — {plotName}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Plot #{plotId} ({location}) · Device: <code>{deviceId}</code>
      </p>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--primary-dim)',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        maxWidth: 800,
      }}>
        ℹ️ Pump status is the actual relay state reported by <code>{deviceId}</code> every 5s.
        Manual commands take effect within 4s.
      </div>

      {sensorError && (
        <p style={{ color: 'orange', fontSize: '0.9rem' }}>⚠️ {sensorError}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800 }}>

        {/* ── Pump status card ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pump status</h3>

          {/* FIX: ESP32 actual relay state കാണിക്കുന്നു */}
          <p>
            Current:{' '}
            <strong style={{ color: pumpStatus === 'ON' ? 'green' : 'orange' }}>
              {pumpStatus}
            </strong>
            <span style={{
              marginLeft: 8,
              fontSize: '0.75rem',
              padding: '0.15rem 0.4rem',
              borderRadius: 4,
              background: pumpStatus === 'ON' ? '#d4edda' : '#fff3cd',
              color:      pumpStatus === 'ON' ? '#155724' : '#856404',
            }}>
              {pumpStatus === 'ON' ? '💧 irrigating' : '⏸ idle'}
            </span>
          </p>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -8 }}>
            ESP32 relay state · updates every 5s
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              onClick={() => sendPumpCommand('ON')}
              disabled={pumpStatus === 'ON'}
              style={{
                padding: '0.5rem 1rem',
                background: pumpStatus === 'ON' ? '#ccc' : 'green',
                color: 'white', border: 'none', borderRadius: 6,
                cursor: pumpStatus === 'ON' ? 'not-allowed' : 'pointer'
              }}
            >
              Turn ON
            </button>
            <button
              onClick={() => sendPumpCommand('OFF')}
              disabled={pumpStatus === 'OFF'}
              style={{
                padding: '0.5rem 1rem',
                background: pumpStatus === 'OFF' ? '#ccc' : '#c0392b',
                color: 'white', border: 'none', borderRadius: 6,
                cursor: pumpStatus === 'OFF' ? 'not-allowed' : 'pointer'
              }}
            >
              Turn OFF
            </button>
          </div>

          <hr style={{ opacity: 0.15 }} />

          <p style={{ marginTop: '1rem' }}>
            Soil moisture:{' '}
            <strong>{currentMoisture !== null ? `${moisture}%` : '—'}</strong>
          </p>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Thresholds: start at <strong style={{ color: 'var(--text)' }}>{thresholdLow}%</strong>,
            stop at <strong style={{ color: 'var(--text)' }}>{thresholdHigh}%</strong>
          </p>

          <p>
            Weather check:{' '}
            <strong>{rainWarning ? '⚠️ Rain forecast — delay irrigation' : '✅ Clear'}</strong>
          </p>
        </div>

        {/* ── Thresholds card ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Crop thresholds</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0 }}>
            Saved to MongoDB. ESP32 fetches and applies them within 30s.
          </p>

          <label style={{ display: 'block', marginBottom: '0.75rem' }}>
            Start irrigation below (%):{' '}
            <input
              type="number" min={10} max={80} value={thresholdLow}
              onChange={e => setThresholdLow(Number(e.target.value))}
              style={{ width: 60, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '1rem' }}>
            Stop irrigation above (%):{' '}
            <input
              type="number" min={40} max={95} value={thresholdHigh}
              onChange={e => setThresholdHigh(Number(e.target.value))}
              style={{ width: 60, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
            />
          </label>

          <button
            onClick={saveThresholds}
            disabled={savingThreshold}
            style={{
              padding: '0.5rem 1.25rem',
              background: thresholdSaved ? 'green' : 'var(--primary)',
              color: 'white', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600
            }}
          >
            {savingThreshold ? 'Saving...' : thresholdSaved ? '✅ Saved!' : 'Save thresholds'}
          </button>

          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ESP32 <code>{deviceId}</code> will apply new values within 30s.
          </p>
        </div>
      </div>
    </div>
  )
}