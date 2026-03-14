import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useSearchParams } from 'react-router-dom'

type HistoryEntry = {
  date: string
  moisture: number
  temp: number
  humidity: number
}

const mockHistory: HistoryEntry[] = [
  { date: 'Mon', moisture: 45, temp: 26, humidity: 62 },
  { date: 'Tue', moisture: 42, temp: 28, humidity: 58 },
  { date: 'Wed', moisture: 38, temp: 29, humidity: 55 },
  { date: 'Thu', moisture: 52, temp: 27, humidity: 70 },
  { date: 'Fri', moisture: 48, temp: 28, humidity: 65 },
  { date: 'Sat', moisture: 44, temp: 30, humidity: 60 },
  { date: 'Sun', moisture: 41, temp: 29, humidity: 58 },
]

export default function History() {
  const [searchParams] = useSearchParams()
  const plotId   = searchParams.get('plot')     || '1'
  const location = searchParams.get('location') || 'Unknown location'
  const plotName = searchParams.get('name')     || 'Plot'
  const deviceId = searchParams.get('device')   || ''

  // null = fetch hasn't completed yet (show mock)
  // []   = fetch completed, device has no readings yet (show mock + notice)
  // [...] = real data, always shown instead of mock
  const [realData, setRealData] = useState<HistoryEntry[] | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Derived: real data wins as soon as fetch completes, even if empty
  const chartData = realData ?? mockHistory
  const isReal    = realData !== null && realData.length > 0

  useEffect(() => {
    if (!deviceId) return

    setLoading(true)
    setError(null)

    fetch(`http://localhost:5000/api/sensor/history/${deviceId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        return res.json()
      })
      .then((history: any[]) => {
        // Always set realData — even empty array replaces mock
        // so we know the fetch completed successfully
        const formatted: HistoryEntry[] = history
          .slice()
          .reverse()           // DB sends newest-first; chart needs oldest-first
          .map(item => ({
            date:     new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit'
                      }),
            moisture: Number(item.soilMoisture ?? 0),
            temp:     Number(item.temperature  ?? 0),
            humidity: Number(item.humidity     ?? 0),
          }))

        setRealData(formatted)   // replaces mock immediately
      })
      .catch(err => {
        setError(err.message)
        // On error: realData stays null → mock keeps showing
      })
      .finally(() => setLoading(false))

  }, [deviceId])

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>
        Historical Sensor Data{plotName ? ` — ${plotName}` : ''}
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Plot #{plotId} ({location}) · device <code>{deviceId || '—'}</code>
      </p>

      {loading && <p>Loading from database...</p>}
      {error   && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Only show this notice after fetch completes with zero results */}
      {realData !== null && realData.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          No readings yet for this device — showing sample data.
        </p>
      )}

      <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <h3 style={{ marginTop: 0 }}>
          {isReal
            ? `Trends (last ${chartData.length} readings)`
            : 'Trends (sample data)'}
        </h3>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-muted)"
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--primary-dim)',
                  borderRadius: 8
                }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Legend />
              <Line
                type="monotone" dataKey="moisture" name="Soil moisture %"
                stroke="var(--accent)"  strokeWidth={2}
                dot={isReal ? false : { fill: 'var(--accent)' }}
              />
              <Line
                type="monotone" dataKey="temp" name="Temperature °C"
                stroke="var(--warning)" strokeWidth={2}
                dot={isReal ? false : { fill: 'var(--warning)' }}
              />
              <Line
                type="monotone" dataKey="humidity" name="Humidity %"
                stroke="var(--primary)" strokeWidth={2}
                dot={isReal ? false : { fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}