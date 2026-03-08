import { useState, useRef } from 'react'

// FR4: Upload crop leaf images for AI-based disease detection; show disease name and suggested remedies
const mockRemedies: Record<string, string[]> = {
  'Leaf Blight': ['Remove infected leaves and destroy.', 'Spray copper-based fungicide every 7–10 days.', 'Improve air circulation and avoid overhead watering.'],
  'Powdery Mildew': ['Apply sulfur or potassium bicarbonate spray.', 'Reduce nitrogen; ensure adequate spacing.'],
  'Rust': ['Apply fungicide containing tebuconazole or propiconazole.', 'Remove and destroy infected plant parts.'],
  'No disease detected': ['Continue monitoring. Ensure balanced nutrition and irrigation.'],
}

export default function DiseaseDetection() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<{ disease: string; confidence: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const analyze = () => {
    if (!file) return
    setLoading(true)
    // Simulate API call to AI service
    setTimeout(() => {
      const diseases = Object.keys(mockRemedies).filter(k => k !== 'No disease detected')
      const pick = Math.random() > 0.4 ? diseases[Math.floor(Math.random() * diseases.length)] : 'No disease detected'
      setResult({ disease: pick, confidence: 0.85 + Math.random() * 0.14 })
      setLoading(false)
    }, 1500)
  }

  const remedies = result ? mockRemedies[result.disease] || mockRemedies['No disease detected'] : []

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Disease Detection</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Upload a crop leaf image for AI-based disease detection and suggested remedies.
      </p>
      <div className="card" style={{ maxWidth: 520, marginTop: '1rem' }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '1rem 1.5rem',
            background: 'var(--primary)',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          Choose leaf image
        </button>
        {preview && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <img src={preview} alt="Leaf" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8 }} />
            </div>
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                background: loading ? 'var(--surface-hover)' : 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: 'var(--bg)',
                fontWeight: 600,
              }}
            >
              {loading ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </>
        )}
      </div>
      {result && (
        <div className="card" style={{ maxWidth: 520, marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Result</h3>
          <p>
            <strong>Disease:</strong> {result.disease} ({(result.confidence * 100).toFixed(0)}% confidence)
          </p>
          <p><strong>Suggested remedies:</strong></p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            {remedies.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
