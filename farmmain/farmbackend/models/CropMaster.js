const mongoose = require('mongoose');

const cropMasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Vegetable', 'Fruit', 'Grain', 'Spice', 'Tuber'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'kg'
  },
  imageUrl: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CropMaster', cropMasterSchema);
