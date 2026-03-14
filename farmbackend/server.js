const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const axios = require("axios")

const app = express()

app.use(cors())
app.use(express.json())

// ==============================
// MongoDB Connection
// ==============================

mongoose.connect(
  "mongodb+srv://user:user@cluster0.dypnqbb.mongodb.net/smartag?retryWrites=true&w=majority"
)
.then(() => {
  console.log("MongoDB Connected")
  app.listen(5000, "0.0.0.0", () => {
    console.log("Server running on port 5000")
  })
})
.catch(err => console.log(err))

// ==============================
// Plot Schema
// ==============================

const plotSchema = new mongoose.Schema({
  name: String,
  crop: String,
  location: String,
  latitude: Number,
  longitude: Number,
  deviceId: String,
  startThreshold: Number,
  stopThreshold: Number
})

const Plot = mongoose.model("Plot", plotSchema)

// ==============================
// Sensor Schema
// ==============================

const sensorSchema = new mongoose.Schema({
  deviceId: String,
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Sensor = mongoose.model("Sensor", sensorSchema)

// ==============================
// Pump Status Schema (persistent)
// ==============================

const pumpSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true },
  status: { type: String, default: "OFF" },
  updatedAt: { type: Date, default: Date.now }
})

const Pump = mongoose.model("Pump", pumpSchema)

// ==============================
// Crop Thresholds
// ==============================

const cropThresholds = {
  Rice:      { start: 60, stop: 80 },
  Wheat:     { start: 40, stop: 60 },
  Tomato:    { start: 50, stop: 70 },
  Cotton:    { start: 45, stop: 65 },
  Sugarcane: { start: 55, stop: 75 },
  Maize:     { start: 50, stop: 70 },
  Corn:      { start: 50, stop: 70 },
  Soybean:   { start: 45, stop: 65 },
  Potato:    { start: 55, stop: 75 }
}

// ==============================
// Add Plot
// ==============================

app.post("/api/plots", async (req, res) => {
  try {
    const { crop } = req.body
    const threshold = cropThresholds[crop] || { start: 40, stop: 70 }

    const plot = new Plot({
      ...req.body,
      startThreshold: threshold.start,
      stopThreshold: threshold.stop
    })

    await plot.save()
    res.json(plot)
  } catch (err) {
    res.status(500).json({ message: "Error creating plot" })
  }
})

// ==============================
// Get All Plots
// ==============================

app.get("/api/plots", async (req, res) => {
  try {
    const plots = await Plot.find()
    res.json(plots)
  } catch (err) {
    res.status(500).json({ message: "Error fetching plots" })
  }
})

// ==============================
// Delete Plot
// ==============================

app.delete("/api/plots/:id", async (req, res) => {
  try {
    await Plot.findByIdAndDelete(req.params.id)
    res.json({ message: "Plot deleted" })
  } catch (err) {
    res.status(500).json({ message: "Error deleting plot" })
  }
})

// ==============================
// Get Plot Thresholds (for ESP + dashboard)
// ==============================

app.get("/api/threshold/:deviceId", async (req, res) => {
  try {
    const plot = await Plot.findOne({ deviceId: req.params.deviceId })
    if (!plot) return res.json({ start: 40, stop: 70 })
    res.json({ start: plot.startThreshold, stop: plot.stopThreshold })
  } catch (err) {
    res.status(500).json({ message: "Threshold error" })
  }
})

// ==============================
// UPDATE Plot Thresholds (from dashboard)
// ==============================

app.put("/api/threshold/:deviceId", async (req, res) => {
  try {
    const { start, stop } = req.body
    const plot = await Plot.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { startThreshold: start, stopThreshold: stop },
      { new: true }
    )
    if (!plot) return res.status(404).json({ message: "Plot not found" })
    res.json({ start: plot.startThreshold, stop: plot.stopThreshold })
  } catch (err) {
    res.status(500).json({ message: "Error updating threshold" })
  }
})

// ==============================
// Receive Sensor Data From ESP
// ==============================

app.post("/api/sensor", async (req, res) => {
  try {
    const { deviceId, temperature, humidity, soilMoisture } = req.body
    const data = new Sensor({ deviceId, temperature, humidity, soilMoisture })
    await data.save()
    res.json({ message: "Sensor data saved" })
  } catch (err) {
    res.status(500).json({ message: "Error saving sensor data" })
  }
})

// ==============================
// Get Latest Sensor Data
// ==============================

app.get("/api/sensor/:deviceId", async (req, res) => {
  try {
    const data = await Sensor.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: "Error fetching sensor data" })
  }
})

// ==============================
// Get Sensor History (last 50 readings)
// ==============================

app.get("/api/sensor/history/:deviceId", async (req, res) => {
  try {
    const data = await Sensor.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" })
  }
})

// ==============================
// Pump Control — Dashboard sends command
// ==============================

app.post("/api/pump", async (req, res) => {
  const { deviceId, status } = req.body
  try {
    await Pump.findOneAndUpdate(
      { deviceId },
      { status, updatedAt: new Date() },
      { upsert: true, new: true }
    )
    res.json({ message: "Pump command updated", status })
  } catch (err) {
    res.status(500).json({ message: "Error updating pump status" })
  }
})

// ESP polls pump status
app.get("/api/pump/:deviceId", async (req, res) => {
  try {
    const pump = await Pump.findOne({ deviceId: req.params.deviceId })
    res.json({ status: pump ? pump.status : "OFF" })
  } catch (err) {
    res.json({ status: "OFF" })
  }
})

// ==============================
// Weather API
// ==============================

const WEATHER_KEY = "ee1e7d895befb3227749a7f965d43aa0"

app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`
  try {
    const response = await axios.get(url)
    res.json(response.data)
  } catch (err) {
    res.status(500).json({ message: "Weather API error" })
  }
})