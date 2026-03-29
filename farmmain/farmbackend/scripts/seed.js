const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const uri = "mongodb://user:user@ac-ynkznag-shard-00-00.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-01.dypnqbb.mongodb.net:27017,ac-ynkznag-shard-00-02.dypnqbb.mongodb.net:27017/smartag?ssl=true&authSource=admin&replicaSet=atlas-ptkiw5-shard-0&retryWrites=true&w=majority";

const today = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const daysFromNow = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return iso(d)
}

function svgDataUri(label, bg) {
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

const mockCrops = [
  {
    name: 'Fresh Ginger',
    price: 6.5,
    quantity: 80,
    harvestDate: daysFromNow(-18),
    location: 'Wayanad',
    farmer: 'u_farmer_1',
    imageUrl: svgDataUri('Ginger', '#2f855a'),
  },
  {
    name: 'Sun-Ripe Tomatoes',
    price: 2.4,
    quantity: 160,
    harvestDate: daysFromNow(-6),
    location: 'Palakkad',
    farmer: 'u_farmer_1',
    imageUrl: svgDataUri('Tomatoes', '#2f6b3f'),
  },
  {
    name: 'Organic Spinach',
    price: 1.9,
    quantity: 140,
    harvestDate: daysFromNow(-2),
    location: 'Idukki',
    farmer: 'u_farmer_1',
    imageUrl: svgDataUri('Spinach', '#2b7a3a'),
  },
  {
    name: 'Sweet Mangoes',
    price: 3.2,
    quantity: 60,
    harvestDate: daysFromNow(-12),
    location: 'Kochi',
    farmer: 'u_farmer_2',
    imageUrl: svgDataUri('Mangoes', '#2e7d32'),
  },
  {
    name: 'Citrus Oranges',
    price: 2.8,
    quantity: 95,
    harvestDate: daysFromNow(-9),
    location: 'Ernakulam',
    farmer: 'u_farmer_2',
    imageUrl: svgDataUri('Oranges', '#276749'),
  },
  {
    name: 'Washed Potatoes',
    price: 1.15,
    quantity: 220,
    harvestDate: daysFromNow(-25),
    location: 'Alleppey',
    farmer: 'u_farmer_1',
    imageUrl: svgDataUri('Potatoes', '#2f855a'),
  },
];

console.log('Connecting to database...');
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected! Deleting old crops...');
    await Crop.deleteMany({});
    
    console.log('Inserting mock data...');
    const dummyFarmerId = new mongoose.Types.ObjectId();
    const formattedCrops = mockCrops.map(c => ({
      name: c.name,
      quantity: c.quantity,
      price: c.price,
      location: c.location,
      imageUrl: c.imageUrl,
      dateOfPlanting: new Date(new Date(c.harvestDate).getTime() - 90*24*60*60*1000), // 3 months prior
      estimatedHarvestTime: new Date(c.harvestDate),
      farmerId: dummyFarmerId
    }));
    await Crop.insertMany(formattedCrops);
    
    console.log('Dummy data seeded successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to seed:', err);
    process.exit(1);
  });
