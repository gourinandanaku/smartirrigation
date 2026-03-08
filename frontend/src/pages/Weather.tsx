import { useEffect, useState } from 'react'

// FR3: Weather forecasting — rainfall probability and temperature trends for irrigation planning
type ForecastItem = {
  day: string
  temp: number
  rain: number
  desc: string
}

export default function Weather() {
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('http://localhost:5000/api/weather')

      if (!res.ok) {
        throw new Error('Failed to fetch weather')
      }

      const data = await res.json()

      const items = (data.list || []).slice(0, 5).map((entry, idx) => ({
        day: idx === 0 ? 'Now' : `Next ${idx * 3}h`,
        temp: Math.round(entry.main?.temp ?? 0),
        rain: Math.round((entry.pop ?? 0) * 100),
        desc: entry.weather?.[0]?.description ?? 'N/A',
      }))

      setForecast(items)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  fetchWeather()
}, [])

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Weather Forecast</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Rainfall probability and temperature trends used for irrigation planning.
      </p>
      {loading && <p>Loading latest forecast from server...</p>}
      {error && (
        <p style={{ color: 'red', marginTop: '0.5rem' }}>
          Failed to load weather data: {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
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
      <div className="card" style={{ marginTop: '1.5rem', maxWidth: 500 }}>
        <h3 style={{ marginTop: 0 }}>Irrigation recommendation</h3>
        <p style={{ margin: 0 }}>
          Tomorrow has 60% rain probability — consider delaying irrigation. Temperature trend is stable (26–30°C).
        </p>
      </div>
    </div>
  )
}
