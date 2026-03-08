const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/* ==============================
   🔗 MongoDB Connection
============================== */

mongoose.connect("mongodb+srv://user:user@cluster0.dypnqbb.mongodb.net/smartag?retryWrites=true&w=majority")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


/* ==============================
   🌱 Sensor Data Schema
============================== */

const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Sensor = mongoose.model("Sensor", sensorSchema);


/* ==============================
   🌾 Plot Schema
============================== */

const plotSchema = new mongoose.Schema({
  name: String,
  crop: String,
  location: String,
  deviceId: String,
  area: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Plot = mongoose.model("Plot", plotSchema);

/* ==============================
   🌤 Weather API Route
============================== */

app.get("/api/weather", async (req, res) => {
  try {
    const city = "Kochi";
    const apiKey = "ee1e7d895befb3227749a7f965d43aa0";

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
    );

    res.json(response.data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Weather fetch failed" });
  }
});


/* ==============================
   🔁 Simulate Sensor Data
============================== */

app.get("/api/simulate-sensor", async (req, res) => {
  const temp = (25 + Math.random() * 5).toFixed(1);
  const humidity = (60 + Math.random() * 20).toFixed(1);

  const newData = new Sensor({
    temperature: temp,
    humidity: humidity
  });

  await newData.save();

  res.json(newData);
});


/* ==============================
   📊 Get Latest Sensor Data
============================== */

app.get("/api/sensor/latest", async (req, res) => {
  const data = await Sensor.findOne().sort({ createdAt: -1 });
  res.json(data);
});

/* ==============================
   ➕ Add New Plot
============================== */

app.post("/api/plots", async (req, res) => {
  try {
    const { name, crop, location, deviceId, area } = req.body;

    const newPlot = new Plot({
      name,
      crop,
      location,
      deviceId,
      area
    });

    await newPlot.save();

    res.json(newPlot);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating plot" });
  }
});
/* ==============================
   📋 Get All Plots
============================== */

app.get("/api/plots", async (req, res) => {
  try {
    const plots = await Plot.find().sort({ createdAt: -1 });
    res.json(plots);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch plots" });
  }
});
/* ==============================
   ❌ Delete Plot
============================== */

app.delete("/api/plots/:id", async (req, res) => {
  try {
    await Plot.findByIdAndDelete(req.params.id);
    res.json({ message: "Plot deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete plot" });
  }
});
/* ==============================
   🚀 Start Server
============================== */

app.listen(5000, () => {
  console.log("Server running on port 5000");
});