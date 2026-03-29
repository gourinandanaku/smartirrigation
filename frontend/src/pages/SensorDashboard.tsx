import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type ForecastItem = {
  day: string
  temp: number
  rain: number
  desc: string
}

type TabType = 'sensors' | 'weather' | 'history' | 'irrigation'

type HistoryEntry = {
  date: string
  moisture: number
  temp: number
  humidity: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SensorDashboard() {
  const [searchParams] = useSearchParams()

  const plotId   = searchParams.get('plot')     || ''
  const deviceId = searchParams.get('device')   || ''
  const location = searchParams.get('location') || ''
  const plotName = searchParams.get('name')     || 'Plot'

  const [activeTab, setActiveTab] = useState<TabType>('sensors')

  // ── Sensor state ──────────────────────────────────────────────────────────
  const [sensors, setSensors] = useState({
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
    updated: new Date().toISOString(),
  })
  const [sensorError, setSensorError] = useState<string | null>(null)

  // ── Weather state ─────────────────────────────────────────────────────────
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)

  // ── History state ─────────────────────────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // ── Irrigation / pump state ───────────────────────────────────────────────
  const [thresholdLow, setThresholdLow]   = useState(40)
  const [thresholdHigh, setThresholdHigh] = useState(70)
  const [pumpStatus, setPumpStatus]       = useState<'ON' | 'OFF'>('OFF')
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [thresholdSaved, setThresholdSaved]   = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // THRESHOLDS + PUMP STATUS — load on mount so values are ready immediately.
  //
  // FIX: Previously this only ran when the Irrigation tab was opened, so the
  // crop-specific thresholds from MongoDB were never available to the rest of
  // the component on first render. Now they load as soon as deviceId is known.
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    const loadThresholds = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/threshold/${deviceId}`)
        if (!res.ok) return
        const data = await res.json()
        setThresholdLow(data.start)
        setThresholdHigh(data.stop)
      } catch {
        // keep defaults on error
      }
    }

    const loadPumpStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pump/${deviceId}`)
        if (!res.ok) return
        const data = await res.json()
        setPumpStatus(data.status === 'ON' ? 'ON' : 'OFF')
      } catch {
        // ignore
      }
    }

    loadThresholds()
    loadPumpStatus()
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // SENSOR POLLING — every 5 s
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!deviceId) return

    const fetchLatest = async () => {
      try {
        setSensorError(null)
        const res = await fetch(`http://localhost:5000/api/sensor/${deviceId}`)
        if (!res.ok) throw new Error('Failed to fetch sensor data')
        const data = await res.json()
        const latest = Array.isArray(data) ? data[0] : data
        if (!latest) return
        setSensors({
          soilMoisture: Number(latest.soilMoisture ?? 0),
          temperature:  Number(latest.temperature  ?? 0),
          humidity:     Number(latest.humidity     ?? 0),
          updated:      latest.createdAt ?? new Date().toISOString()
        })
        setPumpStatus(latest.pumpRunning ? 'ON' : 'OFF')
      } catch (err) {
        setSensorError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchLatest()
    const t = setInterval(fetchLatest, 5000)
    return () => clearInterval(t)
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // WEATHER — uses lat/lon parsed from the "location" URL param
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!location) return

    const fetchWeather = async () => {
      try {
        setWeatherError(null)
        setLoadingWeather(true)

        const [lat, lon] = location.split(',').map(s => s.trim())
        if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
          throw new Error('Invalid plot coordinates in URL')
        }

        const res = await fetch(`http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`)
        if (!res.ok) throw new Error('Failed to fetch weather')
        const data = await res.json()

        setForecast(
          (data.list || []).slice(0, 5).map((entry: any, idx: number) => ({
            day:  idx === 0 ? 'Now' : `+${idx * 3}h`,
            temp: Math.round(entry.main?.temp ?? 0),
            rain: Math.round((entry.pop ?? 0) * 100),
            desc: entry.weather?.[0]?.description ?? 'N/A',
          }))
        )
      } catch (err) {
        setWeatherError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoadingWeather(false)
      }
    }

    fetchWeather()
  }, [location])

  // ══════════════════════════════════════════════════════════════════════════
  // HISTORY — fetched once when history tab first opens
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab !== 'history' || !deviceId) return
    if (history.length > 0) return

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        const res = await fetch(`http://localhost:5000/api/sensor/history/${deviceId}`)
        if (!res.ok) throw new Error('Failed to fetch history')
        const data = await res.json()

        const mapped: HistoryEntry[] = data
          .slice()
          .reverse()
          .map((entry: any) => ({
            date:     new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            moisture: Number(entry.soilMoisture ?? 0),
            temp:     Number(entry.temperature  ?? 0),
            humidity: Number(entry.humidity     ?? 0),
          }))

        setHistory(mapped)
      } catch (err) {
        setHistoryError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistory()
  }, [activeTab, deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // AUTO IRRIGATION — REMOVED FROM REACT.
  //
  // FIX: The ESP32 already runs its own auto-irrigation loop inside
  // sendSensorData() every 5 s, using the crop-specific thresholds it fetches
  // from MongoDB every 30 s. Having React also send pump commands on every
  // moisture poll created a race condition: the dashboard would toggle the pump
  // back OFF moments after the ESP turned it ON (or vice versa), because both
  // sides used independent state and different timing.
  //
  // The correct division of responsibility is:
  //   • ESP32  → sole authority for AUTO irrigation (runs on-device, reliable)
  //   • React  → MANUAL override (Turn ON / Turn OFF buttons) + threshold edits
  //
  // If you want a dashboard "auto mode" indicator, read pumpStatus from the
  // GET /api/pump/:deviceId poll — the ESP will have already updated it.
  // ══════════════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /** Manual override — POST /api/pump → ESP polls every 4 s and toggles relay */
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
      // ignore
    }
  }

  /**
   * Save thresholds to MongoDB.
   * ESP32 fetches GET /api/threshold/:deviceId every 30 s (getThreshold())
   * and updates its local startWateringAt / stopWateringAt variables.
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
  const moistureStatus = sensors.soilMoisture < 30 ? 'low' : sensors.soilMoisture > 70 ? 'high' : 'ok'
  const tempStatus     = sensors.temperature < 15 || sensors.temperature > 38 ? 'abnormal' : 'normal'
  const rainWarning    = forecast.some(f => f.rain > 50)

  const tabItems: { key: TabType; label: string }[] = [
    { key: 'sensors',    label: 'Sensor Data' },
    { key: 'weather',    label: 'Weather' },
    { key: 'history',    label: 'History' },
    { key: 'irrigation', label: 'Irrigation' },
  ]

  if (!deviceId) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        ⚠️ Device ID missing. Please open the dashboard from a plot card.
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Plot Dashboard: {plotName}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Plot #{plotId} · Device: <code>{deviceId}</code> · Location: {location}
      </p>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--surface-hover)',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        overflow: 'auto',
      }}>
        {tabItems.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: '0.95rem',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: SENSOR DATA ── */}
      {activeTab === 'sensors' && (
        <div>
          {sensorError && (
            <p style={{ color: 'red' }}>Failed to load sensor data: {sensorError}</p>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Soil Moisture</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sensors.soilMoisture}%</div>
              <span className={`badge badge--${moistureStatus === 'low' ? 'danger' : moistureStatus === 'high' ? 'warning' : 'success'}`}>
                {moistureStatus}
              </span>
            </div>

            <div className="card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Temperature</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sensors.temperature}°C</div>
              <span className={`badge badge--${tempStatus === 'abnormal' ? 'warning' : 'success'}`}>
                {tempStatus}
              </span>
            </div>

            <div className="card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Humidity</div>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{sensors.humidity}%</div>
              <span className="badge badge--success">ambient</span>
            </div>

            <div className="card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pump Status</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pumpStatus}</div>
              <span className={`badge badge--${pumpStatus === 'ON' ? 'success' : 'warning'}`}>
                {pumpStatus === 'ON' ? 'irrigating' : 'idle'}
              </span>
            </div>
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Last updated: {new Date(sensors.updated).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* ── TAB: WEATHER ── */}
      {activeTab === 'weather' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Weather Forecast — {location}</h2>

          {loadingWeather && <p>Loading forecast...</p>}
          {weatherError && <p style={{ color: 'red' }}>Failed to load weather: {weatherError}</p>}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {forecast.map(f => (
              <div key={f.day} className="card" style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{f.day}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{f.temp}°C</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  Rain: <strong>{f.rain}%</strong>
                  {f.rain > 50 && (
                    <span className="badge badge--warning" style={{ marginLeft: 6 }}>Skip irrigation</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {forecast.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', maxWidth: 500 }}>
              <h3 style={{ marginTop: 0 }}>Irrigation Recommendation</h3>
              <p style={{ margin: 0 }}>
                {rainWarning
                  ? `⚠️ High rain probability detected — consider delaying irrigation for ${plotName}.`
                  : `✅ Conditions stable for ${plotName}. Proceed with irrigation schedule.`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: HISTORY ── */}
      {activeTab === 'history' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Historical Sensor Data — {plotName}</h2>

          {historyLoading && <p>Loading history from database...</p>}
          {historyError  && <p style={{ color: 'red' }}>Error: {historyError}</p>}

          {!historyLoading && history.length === 0 && !historyError && (
            <p style={{ color: 'var(--text-muted)' }}>No historical data yet for device {deviceId}.</p>
          )}

          {history.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <h3 style={{ marginTop: 0 }}>Trends (last {history.length} readings)</h3>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} interval="preserveStartEnd" />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--primary-dim)', borderRadius: 8 }}
                      labelStyle={{ color: 'var(--text)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="moisture"  name="Soil Moisture %"  stroke="var(--accent)"   strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="temp"      name="Temperature °C"   stroke="var(--warning)"  strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="humidity"  name="Humidity %"       stroke="var(--primary)"  strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: IRRIGATION ── */}
      {activeTab === 'irrigation' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Irrigation Control — {plotName}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Manual pump control and threshold editing. Auto-irrigation runs on the ESP32 device itself.
          </p>

          {/* Info banner explaining the architecture */}
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
            ℹ️ Auto-irrigation is handled by the <code>{deviceId}</code> device using the thresholds below.
            Use the buttons here for manual overrides only. The ESP32 will resume auto mode once
            soil moisture reaches the stop threshold.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800 }}>

            {/* ── Pump control card ── */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Pump Status</h3>
              <p>
                Current: <strong style={{ color: pumpStatus === 'ON' ? 'green' : 'orange' }}>{pumpStatus}</strong>
              </p>

              {/* Manual buttons — sets manualOverride on ESP32 via pump API */}
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
                  💧 Turn ON
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
                  🚫 Turn OFF
                </button>
              </div>

              <hr style={{ opacity: 0.2 }} />

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 0 }}>
                Current moisture: <strong style={{ color: 'var(--text)' }}>{sensors.soilMoisture}%</strong>
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Thresholds: start at <strong style={{ color: 'var(--text)' }}>{thresholdLow}%</strong>,
                stop at <strong style={{ color: 'var(--text)' }}>{thresholdHigh}%</strong>
              </p>

              {rainWarning && (
                <p style={{ color: 'orange', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  ⚠️ Rain forecast &gt;50% — consider leaving pump OFF.
                </p>
              )}
            </div>

            {/* ── Thresholds card ── */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Crop Thresholds</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0 }}>
                Saved to MongoDB. ESP32 fetches and applies them within 30 s.
              </p>

              <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem' }}>Start irrigation below (%):</span><br />
                <input
                  type="number" min={10} max={80} value={thresholdLow}
                  onChange={e => setThresholdLow(Number(e.target.value))}
                  style={{ marginTop: 4, width: 80, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem' }}>Stop irrigation above (%):</span><br />
                <input
                  type="number" min={40} max={95} value={thresholdHigh}
                  onChange={e => setThresholdHigh(Number(e.target.value))}
                  style={{ marginTop: 4, width: 80, padding: '0.35rem', borderRadius: 6, border: '1px solid var(--primary-dim)' }}
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
                {savingThreshold ? 'Saving...' : thresholdSaved ? '✅ Saved!' : 'Save Thresholds'}
              </button>

              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Device <code>{deviceId}</code> will apply new thresholds within 30 s.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}