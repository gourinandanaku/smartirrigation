const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Plot name is required'],
    trim: true
  },
  crop: { 
    type: String, 
    required: [true, 'Crop type is required'] 
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'] 
  },
  latitude: { type: Number },
  longitude: { type: Number },
  deviceId: { 
    type: String, 
    required: [true, 'Device ID is required'], 
    unique: true 
  },
  startThreshold: { 
    type: Number, 
    required: [true, 'Start irrigation threshold is required'] 
  },
  stopThreshold: { 
    type: Number, 
    required: [true, 'Stop irrigation threshold is required'] 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Plot', plotSchema);
