const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Buyer relation is required'] 
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
  }],
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'], 
    min: [0, 'Amount cannot be negative'] 
  },
  paymentMethod: { 
    type: String, 
    enum: ['COD', 'ONLINE'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed'], 
    required: true 
  },
  orderStatus: { 
    type: String, 
    enum: ['placed', 'confirmed', 'delivered', 'cancelled'], 
    default: 'placed', 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Order', orderSchema);
