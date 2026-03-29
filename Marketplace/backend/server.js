const express = require('express')
const cors = require('cors')
require('dotenv').config()
const connectDB = require('./config/db')

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Health check (temporary, for Step 1 testing)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smart-farm-marketplace-backend' })
})

// Crop Routes
const cropRoutes = require('./routes/cropRoutes');
app.use('/api/crops', cropRoutes);

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`)
})

