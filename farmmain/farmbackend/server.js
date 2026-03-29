require('dotenv').config({ quiet: true })
const express = require("express")
const cors = require("cors")
const connectDB = require('./config/db')

// Models (Kept here if needed for direct app usage, though mostly in controllers now)
const User = require('./models/User')
const Crop = require('./models/Crop')
const Plot = require('./models/Plot')
const Sensor = require('./models/Sensor')
const Pump = require('./models/Pump')
const CropThreshold = require('./models/CropThreshold')

const app = express()

app.use(cors())
app.use(express.json())

// Connect to Database
connectDB()

// Import Routes
const authRoutes = require("./routes/authRoutes")
const cropRoutes = require("./routes/cropRoutes")
const orderRoutes = require("./routes/orderRoutes")
const plotRoutes = require("./routes/plotRoutes")
const iotRoutes = require("./routes/iotRoutes")

// Mount Routes
app.use("/api/auth", authRoutes)
app.use("/api/crops", cropRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api", plotRoutes) // Plots and thresholds
app.use("/api", iotRoutes)  // Sensors, pumps, and weather

// Error Handling Middleware
const { errorHandler } = require('./middleware/errorMiddleware')
app.use(errorHandler)

// Start Server
const PORT = process.env.PORT || 5000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})
