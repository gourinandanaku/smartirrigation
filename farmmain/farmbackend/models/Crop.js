const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Crop name is required'],
    trim: true
  },
  description: { 
    type: String, 
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['Vegetable', 'Fruit', 'Grain', 'Spice', 'Tuber'],
    default: 'Vegetable'
  },
  unit: {
    type: String,
    default: 'kg'
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  dateOfPlanting: { 
    type: Date, 
    required: [true, 'Date of planting is required'] 
  },
  estimatedHarvestTime: { 
    type: Date, 
    required: [true, 'Estimated harvest time is required'] 
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'] 
  },
  imageUrl: { 
    type: String, 
    required: [true, 'Image URL is required'] 
  },
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Farmer relation is required'] 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Crop', cropSchema);
