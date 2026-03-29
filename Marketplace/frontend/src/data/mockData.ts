import type { Crop, Order, SessionState, User } from './types'

function svgDataUri(label: string, bg: string) {
  const safeLabel = label.replace(/&/g, 'and')
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#14532d" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="900" height="600" rx="28" fill="url(#g)"/>
    <g filter="url(#shadow)">
      <circle cx="710" cy="170" r="105" fill="rgba(255,255,255,0.14)"/>
      <circle cx="220" cy="420" r="140" fill="rgba(255,255,255,0.10)"/>
    </g>
    <text x="56" y="250" font-size="78" font-family="Segoe UI, Arial" font-weight="800" fill="rgba(255,255,255,0.95)">${safeLabel}</text>
    <text x="56" y="330" font-size="28" font-family="Segoe UI, Arial" font-weight="600" fill="rgba(255,255,255,0.85)">Smart Farm Market</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

export const mockUsers: User[] = [
  { id: 'u_admin', name: 'Marketplace Admin', role: 'admin' },
  { id: 'u_farmer_1', name: 'Green Valley Farms', role: 'farmer' },
  { id: 'u_farmer_2', name: 'Sunrise Orchard Co.', role: 'farmer' },
  { id: 'u_buyer_1', name: 'Amina Johnson', role: 'buyer' },
  { id: 'u_buyer_2', name: 'Noah Patel', role: 'buyer' },
]

const today = new Date()
const iso = (d: Date) => d.toISOString().slice(0, 10)
const daysFromNow = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return iso(d)
}

export const mockCrops: Crop[] = [
  {
    id: 'c_ginger',
    name: 'Fresh Ginger',
    pricePerKg: 6.5,
    quantityAvailable: 80,
    harvestDate: daysFromNow(-18),
    location: 'Nairobi',
    farmerId: 'u_farmer_1',
    imageUrl: svgDataUri('Ginger', '#2f855a'),
  },
  {
    id: 'c_tomatoes',
    name: 'Sun-Ripe Tomatoes',
    pricePerKg: 2.4,
    quantityAvailable: 160,
    harvestDate: daysFromNow(-6),
    location: 'Nairobi',
    farmerId: 'u_farmer_1',
    imageUrl: svgDataUri('Tomatoes', '#2f6b3f'),
  },
  {
    id: 'c_spinach',
    name: 'Organic Spinach',
    pricePerKg: 1.9,
    quantityAvailable: 140,
    harvestDate: daysFromNow(-2),
    location: 'Kiambu',
    farmerId: 'u_farmer_1',
    imageUrl: svgDataUri('Spinach', '#2b7a3a'),
  },
  {
    id: 'c_mango',
    name: 'Sweet Mangoes',
    pricePerKg: 3.2,
    quantityAvailable: 60,
    harvestDate: daysFromNow(-12),
    location: 'Mombasa',
    farmerId: 'u_farmer_2',
    imageUrl: svgDataUri('Mangoes', '#2e7d32'),
  },
  {
    id: 'c_oranges',
    name: 'Citrus Oranges',
    pricePerKg: 2.8,
    quantityAvailable: 95,
    harvestDate: daysFromNow(-9),
    location: 'Nakuru',
    farmerId: 'u_farmer_2',
    imageUrl: svgDataUri('Oranges', '#276749'),
  },
  {
    id: 'c_potatoes',
    name: 'Washed Potatoes',
    pricePerKg: 1.15,
    quantityAvailable: 220,
    harvestDate: daysFromNow(-25),
    location: 'Nakuru',
    farmerId: 'u_farmer_1',
    imageUrl: svgDataUri('Potatoes', '#2f855a'),
  },
]

export const mockOrders: Order[] = []

export const mockSession: SessionState = {
  role: 'buyer',
  userId: 'u_buyer_1',
}

