import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

// FR2: Auto control irrigation based on soil moisture thresholds and weather

export default function Irrigation() {
  const [searchParams] = useSearchParams()
  const deviceIdFromUrl = searchParams.get('device')   || ''
  const plotIdFromUrl   = searchParams.get('plot')     || ''
  const locationFromUrl = searchParams.get('location') || ''
  const plotNameFromUrl = searchParams.get('name')     || ''

  // State for active plot (either from URL or storage)
  const [deviceId, setDeviceId] = useState(deviceIdFromUrl)
  const [plotId, setPlotId]     = useState(plotIdFromUrl)
  const [location, setLocation] = useState(locationFromUrl)
  const [plotName, setPlotName] = useState(plotNameFromUrl)

  const [availablePlots, setAvailablePlots] = useState<any[]>([])
  const [loadingPlots, setLoadingPlots]     = useState(false)

  // 1. Sync from URL → Storage
  useEffect(() => {
    if (deviceIdFromUrl) {
      const plotData = { deviceId: deviceIdFromUrl, plotId: plotIdFromUrl, location: locationFromUrl, name: plotNameFromUrl }
      localStorage.setItem('activePlot', JSON.stringify(plotData))
      setDeviceId(deviceIdFromUrl)
      setPlotId(plotIdFromUrl)
      setLocation(locationFromUrl)
      setPlotName(plotNameFromUrl)
    } else {
      // 2. Try to load from Storage if URL is empty
      const saved = localStorage.getItem('activePlot')
      if (saved) {
        const parsed = JSON.parse(saved)
        setDeviceId(parsed.deviceId)
        setPlotId(parsed.plotId)
        setLocation(parsed.location)
        setPlotName(parsed.name)
      }
    }
  }, [deviceIdFromUrl, plotIdFromUrl, locationFromUrl, plotNameFromUrl])

  // 3. Load all plots if we still don't have a deviceId (for selection fallback)
  useEffect(() => {
    if (!deviceId) {
      setLoadingPlots(true)
      fetch('http://localhost:5000/api/plots')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAvailablePlots(data.data || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPlots(false))
    }
  }, [deviceId])

  // ── Pump state ────────────────────────────────────────────────────────────
  const [pumpStatus, setPumpStatus]   = useState<'ON' | 'OFF'>('OFF')
  const [pumpUpdatedAt, setPumpUpdatedAt] = useState<string | null>(null)
  const [autoOn, setAutoOn]           = useState(true)

  // ── Thresholds (loaded from DB, saved back to DB → ESP picks up in 30s) ──
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
  // 1. Load thresholds from MongoDB on mount
  //    ESP32 also fetches this endpoint every 30s via getThreshold()
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    fetch(`http://localhost:5000/api/threshold/${deviceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setThresholdLow(data.data.start)
          setThresholdHigh(data.data.stop)
        }
      })
      .catch(() => {})   // keep defaults on error
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Load current pump status from MongoDB on mount
  //    ESP32 polls this endpoint every 4s via checkPumpCommand()
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    fetch(`http://localhost:5000/api/pump/${deviceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setPumpStatus(data.data.status === 'ON' ? 'ON' : 'OFF')
          setPumpUpdatedAt(data.data.updatedAt)
        }
      })
      .catch(() => {})
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Poll live sensor data every 5s
  //    ESP32 sends POST /api/sensor every 5s via sendSensorData()
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    const fetchMoisture = async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/sensor/${deviceId}`)
        const data = await res.json()
        const latest = Array.isArray(data) ? data[0] : data
        if (latest) setCurrentMoisture(Number(latest.soilMoisture ?? 0))
        setSensorError(null)
      } catch {
        setSensorError('Could not reach sensor')
      }
    }

    fetchMoisture()
    const t = setInterval(fetchMoisture, 5000)
    return () => clearInterval(t)
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // 4. Weather rain check — uses lat/lon from location URL param
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
  // 5. Auto mode — when moisture drops below low threshold, fire pump ON
  //    Mirrors the ESP32 logic in sendSensorData():
  //      if(moisturePercent < startWateringAt) isPumpRunning = true;
  //      if(moisturePercent >= stopWateringAt)  isPumpRunning = false;
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!autoOn || currentMoisture === null || !deviceId) return

    const target: 'ON' | 'OFF' =
      currentMoisture < thresholdLow  ? 'ON'  :
      currentMoisture >= thresholdHigh ? 'OFF' :
      pumpStatus   // hold current state in between thresholds

    if (target !== pumpStatus) sendPumpCommand(target)
  }, [currentMoisture, autoOn])

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/pump → saved to MongoDB
   * ESP32 polls GET /api/pump/:deviceId every 4s and toggles RELAY_PIN
   */
  const sendPumpCommand = async (status: 'ON' | 'OFF') => {
    if (!deviceId) return
    try {
      await fetch('http://localhost:5000/api/pump', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deviceId, status })
      })
      setPumpStatus(status)
    } catch {
      alert('Failed to send pump command')
    }
  }

  /**
   * PUT /api/threshold/:deviceId → saved to MongoDB
   * ESP32 fetches GET /api/threshold/:deviceId every 30s via getThreshold()
   * and updates its local startWateringAt / stopWateringAt variables
   */
  const saveThresholds = async () => {
    if (!deviceId) return
    try {
      setSavingThreshold(true)
      await fetch(`http://localhost:5000/api/threshold/${deviceId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ start: thresholdLow, stop: thresholdHigh })
      })
      setThresholdSaved(true)
      setTimeout(() => setThresholdSaved(false), 2000)
    } catch {
      alert('Failed to save thresholds')
    } finally {
      setSavingThreshold(false)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const moisture        = currentMoisture ?? 0
  const shouldIrrigate  = autoOn && moisture < thresholdLow && !rainWarning

  if (!deviceId) {
    return (
      <div className="section">
        <h1>Irrigation Control</h1>
        <div className="form" style={{ textAlign: 'left', maxWidth: 600 }}>
          <h2>📡 Not Connected</h2>
          <p className="muted">
            Please select a plot to manage its irrigation.
          </p>
          
          {loadingPlots ? (
            <p>Loading your farm plots...</p>
          ) : availablePlots.length === 0 ? (
            <div>
              <p>No plots found. Please add a plot first.</p>
              <Link to="/dashboard/plots" className="btn btn--primary">Go to Farm Plots</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px', marginTop: '1rem' }}>
              <div className="label">Available Plots</div>
              {availablePlots.map((p: any) => (
                <button 
                  key={p._id} 
                  className="btn" 
                  style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                  onClick={() => {
                    const plotData = { deviceId: p.deviceId, plotId: p._id, location: p.location, name: p.name }
                    localStorage.setItem('activePlot', JSON.stringify(plotData))
                    setDeviceId(p.deviceId)
                    setPlotId(p._id)
                    setLocation(p.location)
                    setPlotName(p.name)
                  }}
                >
                  🌾 {p.name} <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}> (Device: {p.deviceId})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Irrigation Control — {plotName}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Plot #{plotId} ({location}) · Device: <code>{deviceId}</code>
      </p>

      {sensorError && (
        <p style={{ color: 'orange', fontSize: '0.9rem' }}>⚠️ {sensorError}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800, marginTop: '1rem' }}>

        {/* ── Status card ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pump status</h3>

          <p>
            Current:{' '}
            <strong style={{ color: pumpStatus === 'ON' ? 'green' : 'orange' }}>
              {pumpStatus}
            </strong>
          </p>
          {pumpUpdatedAt && (
             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: -10 }}>
               Last updated: {new Date(pumpUpdatedAt).toLocaleString()}
             </p>
          )}

          {/* Manual buttons → POST /api/pump → ESP relay toggles within 4s */}
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

          <h3>Auto mode</h3>
          <p>
            Status: <strong>{autoOn ? '✅ Enabled' : '⏸ Disabled'}</strong>
            <button
              onClick={() => setAutoOn(v => !v)}
              style={{
                marginLeft: '1rem',
                padding: '0.35rem 0.75rem',
                background: autoOn ? 'var(--primary)' : 'var(--surface-hover)',
                border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer',
              }}
            >
              {autoOn ? 'Disable' : 'Enable'}
            </button>
          </p>

          <p>
            Soil moisture:{' '}
            <strong>{currentMoisture !== null ? `${moisture}%` : '—'}</strong>
          </p>

          <p>
            Weather check:{' '}
            <strong>{rainWarning ? '⚠️ Rain forecast — irrigation paused' : '✅ Clear'}</strong>
          </p>

          {shouldIrrigate && (
            <p style={{ color: 'var(--accent)' }}>
              ▶ Auto-irrigating (moisture {moisture}% is below {thresholdLow}%)
            </p>
          )}
        </div>

        {/* ── Thresholds card ── */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Crop thresholds</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0 }}>
            Saved to MongoDB. ESP32 fetches and applies them within 30 s.
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

          {/* PUT /api/threshold/:deviceId → ESP picks up within 30s */}
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
            ESP32 <code>{deviceId}</code> will apply new values within 30 s.
          </p>
        </div>
      </div>
    </div>
  )
}