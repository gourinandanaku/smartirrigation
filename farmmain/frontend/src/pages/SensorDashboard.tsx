import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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

  // URL params passed from FarmPlots when clicking "Open dashboard →"
  const deviceIdFromUrl = searchParams.get('device') || ''
  const plotIdFromUrl   = searchParams.get('plot')   || ''
  const locationFromUrl = searchParams.get('location') || ''
  const plotNameFromUrl = searchParams.get('name')     || ''
  
  // State for active plot (either from URL or storage)
  const [deviceId, setDeviceId] = useState(deviceIdFromUrl)
  const [plotId, setPlotId]     = useState(plotIdFromUrl)
  const [location, setLocation] = useState(locationFromUrl)
  const [plotName, setPlotName] = useState(plotNameFromUrl)

  const [activeTab, setActiveTab] = useState<TabType>('sensors')
  const [availablePlots, setAvailablePlots] = useState<any[]>([])
  const [showPlotSelector, setShowPlotSelector] = useState(false)

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

  // 3. Always load all plots for the Change Plot selector
  useEffect(() => {
    fetch('http://localhost:5000/api/plots')
      .then(res => res.json())
      .then(data => { if (data.success) setAvailablePlots(data.data || []) })
      .catch(() => {})
  }, [])

  function switchPlot(p: any) {
    const plotData = { deviceId: p.deviceId, plotId: p._id, location: p.location, name: p.name }
    localStorage.setItem('activePlot', JSON.stringify(plotData))
    setDeviceId(p.deviceId)
    setPlotId(p._id)
    setLocation(p.location)
    setPlotName(p.name)
    setHistory([])
    setShowPlotSelector(false)
  }

  // ── Sensor state ──────────────────────────────────────────────────────────
  const [sensors, setSensors] = useState({
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
    pumpRunning: false,
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
  const [autoOn, setAutoOn] = useState(true)
  const [thresholdLow, setThresholdLow] = useState(40)
  const [thresholdHigh, setThresholdHigh] = useState(70)
  const [pumpStatus, setPumpStatus] = useState<'ON' | 'OFF'>('OFF')
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [thresholdSaved, setThresholdSaved] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // SENSOR POLLING  — every 5 s, uses deviceId from URL
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
          pumpRunning:  latest.pumpRunning ?? false,
          updated:      latest.createdAt ?? new Date().toISOString()
        })
      } catch (err) {
        setSensorError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    fetchLatest()
    const t = setInterval(fetchLatest, 5000)
    return () => clearInterval(t)
  }, [deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // WEATHER  — uses lat/lon parsed from the "location" URL param
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
  // HISTORY  — fetched once when history tab first opens
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab !== 'history' || !deviceId) return
    if (history.length > 0) return   // already loaded

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        const res = await fetch(`http://localhost:5000/api/sensor/history/${deviceId}`)
        if (!res.ok) throw new Error('Failed to fetch history')
        const data = await res.json()

        // Transform raw sensor docs → chart-friendly array (newest first → reverse for chart)
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
  // THRESHOLDS  — load from server when irrigation tab opens
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (activeTab !== 'irrigation' || !deviceId) return

    const loadThresholds = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/threshold/${deviceId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success && data.data) {
          setThresholdLow(data.data.start)
          setThresholdHigh(data.data.stop)
        }
      } catch {
        // use defaults
      }
    }

    const loadPumpStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/pump/${deviceId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success && data.data) {
          setPumpStatus(data.data.status === 'ON' ? 'ON' : 'OFF')
        }
      } catch {
        // ignore
      }
    }

    loadThresholds()
    loadPumpStatus()
  }, [activeTab, deviceId])

  // ══════════════════════════════════════════════════════════════════════════
  // AUTO IRRIGATION  — when moisture drops below low threshold, send pump ON
  // Only fires when autoOn is true
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!autoOn || !deviceId) return

    const moisture = sensors.soilMoisture
    const targetStatus: 'ON' | 'OFF' = moisture < thresholdLow ? 'ON' : moisture >= thresholdHigh ? 'OFF' : pumpStatus

    if (targetStatus !== pumpStatus) {
      sendPumpCommand(targetStatus)
    }
  }, [sensors.soilMoisture, autoOn])

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Send pump ON/OFF to backend → ESP polls /api/pump/:deviceId every 4 s
   */
  const sendPumpCommand = async (status: 'ON' | 'OFF') => {
    if (!deviceId) return
    try {
      await fetch('http://localhost:5000/api/pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, status })
      })
      setPumpStatus(status)
    } catch {
      // ignore
    }
  }

  /**
   * Save updated thresholds to MongoDB → ESP fetches /api/threshold/:deviceId every 30 s
   */
  const saveThresholds = async () => {
    if (!deviceId) return
    try {
      setSavingThreshold(true)
      await fetch(`http://localhost:5000/api/threshold/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: thresholdLow, stop: thresholdHigh })
      })
      setThresholdSaved(true)
      setTimeout(() => setThresholdSaved(false), 2000)
    } catch {
      alert('Failed to save thresholds')
    } finally {
      setSavingThreshold(false)
    }
  }

  // ── Derived status badges ─────────────────────────────────────────────────
  const moistureStatus = sensors.soilMoisture < 30 ? 'low' : sensors.soilMoisture > 70 ? 'high' : 'ok'
  const tempStatus     = sensors.temperature < 15 || sensors.temperature > 38 ? 'abnormal' : 'normal'
  const rainWarning    = forecast.some(f => f.rain > 50)

  const tabItems: { key: TabType; label: string }[] = [
    { key: 'sensors',    label: 'Sensor Data' },
    { key: 'weather',    label: 'Weather' },
    { key: 'history',    label: 'History' },
    { key: 'irrigation', label: 'Irrigation' },
  ]

  // ─────────────────────────────────────────────────────────────────────────

  if (!deviceId) {
    return (
      <div className="section">
        <h1>Monitoring Dashboard</h1>
        <div className="form" style={{ textAlign: 'left', maxWidth: 600 }}>
          <h2>📡 Not Connected</h2>
          <p className="muted">Please select a plot to view its live sensor data.</p>
          {availablePlots.length === 0 ? (
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
                  onClick={() => switchPlot(p)}
                >
                  🌾 {p.name} <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>(Device: {p.deviceId})</span>
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
      {/* ── Header with Change Plot button ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 4 }}>Plot Dashboard: {plotName}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Plot #{plotId} · Device: <code>{deviceId}</code> · Location: {location}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="btn"
            onClick={() => setShowPlotSelector(v => !v)}
            style={{ whiteSpace: 'nowrap' }}
          >
            🔄 Change Plot
          </button>
          {showPlotSelector && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', boxShadow: 'var(--shadow)',
              minWidth: 260, padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div className="label" style={{ padding: '4px 8px' }}>Switch to Plot</div>
              {availablePlots.length === 0 && (
                <p style={{ padding: '4px 8px', margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>No other plots found.</p>
              )}
              {availablePlots.map((p: any) => (
                <button
                  key={p._id}
                  className="btn"
                  style={{
                    textAlign: 'left', justifyContent: 'flex-start',
                    background: p.deviceId === deviceId ? 'var(--accent-bg)' : undefined,
                    borderColor: p.deviceId === deviceId ? 'var(--accent-border)' : undefined,
                  }}
                  onClick={() => switchPlot(p)}
                >
                  🌾 {p.name}
                  {p.deviceId === deviceId && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>✓ Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SENSOR DATA
          Polls GET /api/sensor/:deviceId every 5 s
      ══════════════════════════════════════════════════════════════════════ */}
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
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {sensors.pumpRunning ? 'RUNNING' : 'STOPPED'}
              </div>
              <span className={`badge badge--${sensors.pumpRunning ? 'success' : 'warning'}`}>
                {sensors.pumpRunning ? 'irrigating' : 'idle'}
              </span>
            </div>
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Last updated: {new Date(sensors.updated).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: WEATHER
          Fetches GET /api/weather?lat=...&lon=... using coords from URL
      ══════════════════════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: HISTORY
          Fetches GET /api/sensor/history/:deviceId (last 50 readings from DB)
      ══════════════════════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: IRRIGATION
          • Manual pump control → POST /api/pump {deviceId, status}
            ESP polls GET /api/pump/:deviceId every 4 s and toggles relay
          • Threshold save → PUT /api/threshold/:deviceId {start, stop}
            ESP fetches GET /api/threshold/:deviceId every 30 s
          • Auto mode uses live sensor moisture vs thresholds
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'irrigation' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Irrigation Control — {plotName}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Manual and automatic irrigation. Thresholds are synced to your ESP32 device every 30 s.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800 }}>

            {/* ── Status card ── */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Pump Status</h3>
              <p>
                Current: <strong style={{ color: pumpStatus === 'ON' ? 'green' : 'orange' }}>{pumpStatus}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => sendPumpCommand('ON')}
                  disabled={pumpStatus === 'ON'}
                  style={{
                    padding: '0.5rem 1rem',
                    background: pumpStatus === 'ON' ? '#ccc' : 'green',
                    color: 'white', border: 'none', borderRadius: 6, cursor: pumpStatus === 'ON' ? 'not-allowed' : 'pointer'
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
                    color: 'white', border: 'none', borderRadius: 6, cursor: pumpStatus === 'OFF' ? 'not-allowed' : 'pointer'
                  }}
                >
                  🚫 Turn OFF
                </button>
              </div>

              <hr style={{ opacity: 0.2 }} />

              <h3>Auto Mode</h3>
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
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Current moisture: <strong>{sensors.soilMoisture}%</strong>
                {autoOn && sensors.soilMoisture < thresholdLow && (
                  <span style={{ color: 'green', marginLeft: 8 }}>▶ Auto-irrigating</span>
                )}
              </p>
              {rainWarning && (
                <p style={{ color: 'orange', fontSize: '0.9rem' }}>
                  ⚠️ Rain forecast &gt;50% — consider disabling auto mode.
                </p>
              )}
            </div>

            {/* ── Thresholds card ── */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Crop Thresholds</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0 }}>
                Changes are saved to MongoDB and the ESP32 fetches them automatically every 30 s.
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
                  color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600
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