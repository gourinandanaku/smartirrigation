const mongoose = require('mongoose');

const cropThresholdSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startThreshold: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  stopThreshold: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CropThreshold', cropThresholdSchema);
