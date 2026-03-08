import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type ForecastItem = {
  day: string
  temp: number
  rain: number
  desc: string
}

type TabType = 'sensors' | 'weather' | 'history' | 'irrigation'

const mockHistory = [
  { date: 'Mon', moisture: 45, temp: 26, humidity: 62 },
  { date: 'Tue', moisture: 42, temp: 28, humidity: 58 },
  { date: 'Wed', moisture: 38, temp: 29, humidity: 55 },
  { date: 'Thu', moisture: 52, temp: 27, humidity: 70 },
  { date: 'Fri', moisture: 48, temp: 28, humidity: 65 },
  { date: 'Sat', moisture: 44, temp: 30, humidity: 60 },
  { date: 'Sun', moisture: 41, temp: 29, humidity: 58 },
]

export default function SensorDashboard() {
  const [searchParams] = useSearchParams()
  const plotId = searchParams.get('plot') || '1'
  const location = searchParams.get('location') || 'Unknown location'
  const plotName = searchParams.get('name') || 'Plot'
  const [activeTab, setActiveTab] = useState<TabType>('sensors')
  
  const [sensors, setSensors] = useState({
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
    updated: new Date().toISOString(),
  })
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [autoOn, setAutoOn] = useState(true)
  const [thresholdLow, setThresholdLow] = useState(25)
  const [thresholdHigh, setThresholdHigh] = useState(65)

  useEffect(() => {
    let cancelled = false

    const seedIfEmpty = async () => {
      // Ensure there is at least one record in the database
      try {
        const res = await fetch('/api/simulate-sensor')
        if (!res.ok) {
          // If seeding fails, we'll still try to read latest below
          return
        }
      } catch {
        // ignore seeding errors; latest may still have data
      }
    }

    const fetchLatest = async () => {
      try {
        setError(null)
        const res = await fetch('/api/sensor/latest')
        if (!res.ok) {
          throw new Error('Failed to fetch sensor data')
        }
        const data = await res.json()
        if (cancelled) return

        setSensors({
          soilMoisture: Number(data.humidity ?? 0), // treat humidity as soil moisture percentage for now
          temperature: Number(data.temperature ?? 0),
          humidity: Number(data.humidity ?? 0),
          updated: data.createdAt ?? new Date().toISOString(),
        })
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    const fetchWeather = async () => {
      try {
        setWeatherError(null)
        setLoadingWeather(true)
        const res = await fetch('http://localhost:5000/api/weather')

        if (!res.ok) {
          throw new Error('Failed to fetch weather')
        }

        const data = await res.json()

        if (cancelled) return

        const items = (data.list || []).slice(0, 5).map((entry, idx) => ({
          day: idx === 0 ? 'Now' : `Next ${idx * 3}h`,
          temp: Math.round(entry.main?.temp ?? 0),
          rain: Math.round((entry.pop ?? 0) * 100),
          desc: entry.weather?.[0]?.description ?? 'N/A',
        }))

        setForecast(items)
      } catch (err) {
        if (cancelled) return
        setWeatherError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoadingWeather(false)
      }
    }

    // initial load: seed once, then read latest and fetch weather
    seedIfEmpty().finally(() => {
      fetchLatest()
      fetchWeather()
    })
    // poll every 5s
    const t = setInterval(fetchLatest, 5000)

    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const moistureStatus = sensors.soilMoisture < 30 ? 'low' : sensors.soilMoisture > 70 ? 'high' : 'ok'
  const tempStatus = sensors.temperature < 15 || sensors.temperature > 38 ? 'abnormal' : 'normal'
  const shouldIrrigate = autoOn && sensors.soilMoisture < thresholdLow

  const tabItems: { key: TabType; label: string }[] = [
    { key: 'sensors', label: 'Sensor Data' },
    { key: 'weather', label: 'Weather' },
    { key: 'history', label: 'History' },
    { key: 'irrigation', label: 'Irrigation' },
  ]

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Plot Dashboard: {plotName}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Plot #{plotId} — Location: {location}
      </p>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0rem',
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

      {/* Sensor Data Tab */}
      {activeTab === 'sensors' && (
        <div>
          {error && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              Failed to load live sensor data: {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="card" style={{ minWidth: 180 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Soil moisture</div>
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
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Last updated: {new Date(sensors.updated).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Weather Tab */}
      {activeTab === 'weather' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Weather Forecast for {location}</h2>
          {loadingWeather && <p>Loading latest forecast...</p>}
          {weatherError && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              Failed to load weather data: {weatherError}
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {forecast.map((f) => (
              <div key={f.day} className="card" style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{f.day}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{f.temp}°C</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  Rain: <strong>{f.rain}%</strong>
                  {f.rain > 50 && <span className="badge badge--warning" style={{ marginLeft: 6 }}>Skip irrigation</span>}
                </div>
              </div>
            ))}
          </div>
          {forecast.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', maxWidth: 500 }}>
              <h3 style={{ marginTop: 0 }}>Irrigation recommendation</h3>
              <p style={{ margin: 0 }}>
                {forecast.some(f => f.rain > 50)
                  ? `High rain probability (${forecast[1]?.rain}%) detected — consider delaying irrigation in ${location}.`
                  : `Conditions look stable for ${location}. Irrigation schedule is optimal.`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Historical Sensor Data</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Trend analysis for {plotName}. Connect your backend to load real historical data.
          </p>
          <div className="card" style={{ overflow: 'hidden' }}>
            <h3 style={{ marginTop: 0 }}>Trends (last 7 days)</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--primary-dim)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="moisture" name="Soil moisture %" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} />
                  <Line type="monotone" dataKey="temp" name="Temperature °C" stroke="var(--warning)" strokeWidth={2} dot={{ fill: 'var(--warning)' }} />
                  <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Irrigation Tab */}
      {activeTab === 'irrigation' && (
        <div>
          <h2 style={{ marginTop: 0 }}>Irrigation Control for {plotName}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Automatic irrigation based on soil moisture thresholds and weather forecast data.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 800 }}>
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
              <p>Current soil moisture: <strong>{sensors.soilMoisture}%</strong></p>
              <p>Weather considered: Yes (no irrigation if rain predicted)</p>
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
      )}
    </div>
  )
}
