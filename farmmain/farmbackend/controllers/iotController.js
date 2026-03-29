const axios = require('axios');
const Sensor = require('../models/Sensor');
const Pump = require('../models/Pump');

// @desc    Save sensor data
// @route   POST /api/sensor
const saveSensorData = async (req, res) => {
  try {
    const { deviceId, temperature, humidity, soilMoisture } = req.body;
    const data = new Sensor({ deviceId, temperature, humidity, soilMoisture });
    await data.save();
    res.status(201).json({ success: true, message: "Sensor data saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving sensor data", error: err.message });
  }
};

// @desc    Get latest sensor data
// @route   GET /api/sensor/:deviceId
const getSensorData = async (req, res) => {
  try {
    const data = await Sensor.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching sensor data", error: err.message });
  }
};

// @desc    Get sensor history
// @route   GET /api/sensor/history/:deviceId
const getSensorHistory = async (req, res) => {
  try {
    const data = await Sensor.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history", error: err.message });
  }
};

// @desc    Update pump status
// @route   POST /api/pump
const updatePumpStatus = async (req, res) => {
  const { deviceId, status } = req.body;
  try {
    const pump = await Pump.findOneAndUpdate(
      { deviceId },
      { status, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Pump command updated", data: { status: pump.status } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating pump status", error: err.message });
  }
};

// @desc    Get pump status
// @route   GET /api/pump/:deviceId
const getPumpStatus = async (req, res) => {
  try {
    const pump = await Pump.findOne({ deviceId: req.params.deviceId });
    res.json({ success: true, data: { status: pump ? pump.status : "OFF" } });
  } catch (err) {
    res.json({ success: true, data: { status: "OFF" } });
  }
};

// @desc    Get weather data
// @route   GET /api/weather
const getWeatherData = async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.WEATHER_KEY || "ee1e7d895befb3227749a7f965d43aa0";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  
  try {
    const response = await axios.get(url);
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Weather API error", error: err.message });
  }
};

module.exports = {
  saveSensorData,
  getSensorData,
  getSensorHistory,
  updatePumpStatus,
  getPumpStatus,
  getWeatherData
};
