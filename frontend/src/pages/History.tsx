import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useSearchParams } from 'react-router-dom'

// FR8: Historical sensor data with graphical visualization for trend analysis
const mockHistory = [
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
  const plotId = searchParams.get('plot') || '1'
  const location = searchParams.get('location') || 'Unknown location'
  const plotName = searchParams.get('name') || 'Plot'
  const [data] = useState(mockHistory)

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Historical Sensor Data {plotName ? `— ${plotName}` : ''}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        {plotName ? `Plot ${plotId} (${location}) — ` : `Plot #{plotId} — `}Trend analysis. Connect your backend to load real historical data.
      </p>
      <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <h3 style={{ marginTop: 0 }}>Trends (last 7 days)</h3>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
  )
}
