const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    required: [true, 'Device ID is required'], 
    ref: 'Plot' // Conceptually connects the sensor readings to the Plot model
  },
  temperature: { 
    type: Number, 
    required: [true, 'Temperature is required'] 
  },
  humidity: { 
    type: Number, 
    required: [true, 'Humidity is required'] 
  },
  soilMoisture: { 
    type: Number, 
    required: [true, 'Soil moisture is required'] 
  },
  // Ensure the TTL Index automatically purges stale sensor data after 7 Days
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 604800 // 7 Days in seconds
  }
});

// TTL Index is automatically handled by the 'expires' property in the field definition above.

module.exports = mongoose.model('Sensor', sensorSchema);
