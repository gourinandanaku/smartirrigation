const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: String,
    required: [true, 'Buyer ID is required']
  },
  items: [
    {
      cropId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'confirmed', 'delivered'],
    default: 'placed'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Order', orderSchema);
