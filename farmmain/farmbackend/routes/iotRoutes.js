const express = require('express');
const router = express.Router();
const {
  saveSensorData,
  getSensorData,
  getSensorHistory,
  updatePumpStatus,
  getPumpStatus,
  getWeatherData
} = require('../controllers/iotController');
const {
  getThresholdByDevice,
  updateThresholdByDevice
} = require('../controllers/plotController');

// Sensor Routes
router.route('/sensor')
  .post(saveSensorData);

router.route('/sensor/:deviceId')
  .get(getSensorData);

router.route('/sensor/history/:deviceId')
  .get(getSensorHistory);

// Pump Routes
router.route('/pump')
  .post(updatePumpStatus);

router.route('/pump/:deviceId')
  .get(getPumpStatus);

// Threshold Routes (for ESP/Hardware)
router.route('/threshold/:deviceId')
  .get(getThresholdByDevice)
  .put(updateThresholdByDevice);

// Weather Route
router.route('/weather')
  .get(getWeatherData);

module.exports = router;
