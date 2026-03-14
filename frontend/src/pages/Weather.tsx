import { useEffect, useState } from 'react'

// FR3: Weather forecasting — rainfall probability and temperature trends for irrigation planning

type ForecastItem = {
  day: string
  temp: number
  rain: number
  desc: string
}

type Plot = {
  _id: string
  name: string
  location: string
  latitude: number
  longitude: number
  crop: string
  area?: string
}

export default function Weather() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [weatherData, setWeatherData] = useState<Record<string, ForecastItem[]>>({})
  const [plotErrors, setPlotErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch all plots from MongoDB via backend
        const plotsRes = await fetch('http://localhost:5000/api/plots')
        if (!plotsRes.ok) throw new Error('Failed to fetch plots')
        const plotsData: Plot[] = await plotsRes.json()
        setPlots(plotsData)

        const weatherMap: Record<string, ForecastItem[]> = {}
        const errMap: Record<string, string> = {}

        // 2. For each plot, fetch weather using stored lat/lon
        await Promise.all(
          plotsData.map(async (plot) => {
            if (!plot.latitude || !plot.longitude) {
              errMap[plot._id] = 'No coordinates saved for this plot. Re-add the plot and pin a location on the map.'
              return
            }

            try {
              const res = await fetch(
                `http://localhost:5000/api/weather?lat=${plot.latitude}&lon=${plot.longitude}`
              )
              if (!res.ok) throw new Error('Weather fetch failed')
              const data = await res.json()

              weatherMap[plot._id] = (data.list || [])
                .slice(0, 5)
                .map((entry: any, idx: number) => ({
                  day:  idx === 0 ? 'Now' : `+${idx * 3}h`,
                  temp: Math.round(entry.main?.temp ?? 0),
                  rain: Math.round((entry.pop ?? 0) * 100),
                  desc: entry.weather?.[0]?.description ?? 'N/A',
                }))
            } catch {
              errMap[plot._id] = 'Could not load weather for this plot.'
            }
          })
        )

        setWeatherData(weatherMap)
        setPlotErrors(errMap)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Weather Forecast</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Rainfall probability and temperature trends — used for auto irrigation decisions.
      </p>

      {loading && <p>Loading forecast from server...</p>}

      {error && (
        <p style={{ color: 'red' }}>Failed to load data: {error}</p>
      )}

      {!loading && !error && plots.length === 0 && (
        <p>No plots found. Add a plot from the Farm Plots page first.</p>
      )}

      {!loading && !error && plots.map((plot) => (
        <div key={plot._id} style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>
            {plot.name} — {plot.location}
          </h2>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            🌾 {plot.crop} · 📍 {plot.latitude?.toFixed(4)}, {plot.longitude?.toFixed(4)}
          </p>

          {/* Per-plot error (missing coords, API fail) */}
          {plotErrors[plot._id] && (
            <p style={{ color: 'orange', fontSize: '0.9rem' }}>
              ⚠️ {plotErrors[plot._id]}
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {(weatherData[plot._id] || []).map(f => (
              <div key={f.day} className="card" style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{f.day}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{f.temp}°C</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  Rain: <strong>{f.rain}%</strong>
                  {f.rain > 50 && (
                    <span className="badge badge--warning" style={{ marginLeft: 6 }}>
                      Skip irrigation
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Per-plot irrigation recommendation */}
          {weatherData[plot._id] && (
            <div className="card" style={{ marginTop: '1rem', maxWidth: 480, padding: '0.75rem 1rem' }}>
              {weatherData[plot._id].some(f => f.rain > 50)
                ? `⚠️ Rain >50% forecast for ${plot.name} — consider delaying irrigation.`
                : `✅ Conditions stable for ${plot.name}. Irrigation schedule is optimal.`
              }
            </div>
          )}
        </div>
      ))}
    </div>
  )
}