const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    required: [true, 'Device ID is required'], 
    unique: true, 
    ref: 'Plot' 
  },
  status: { 
    type: String, 
    enum: ['ON', 'OFF'], 
    default: 'OFF' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Pump', pumpSchema);
