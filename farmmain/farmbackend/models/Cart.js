const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  items: [{
    cropId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Crop', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: [1, 'Quantity must be at least 1'] 
    }
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Cart', cartSchema);
