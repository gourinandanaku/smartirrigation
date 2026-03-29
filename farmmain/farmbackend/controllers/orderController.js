const Order = require('../models/Order');
const Crop = require('../models/Crop');

// @desc    Create a new order & simulated payment
// @route   POST /api/orders
// @access  Public (simulated session)
const createOrder = async (req, res) => {
  try {
    const { buyerId, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!['COD', 'ONLINE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Step 3 functionality: securely calculate total from our DB, not the frontend
    let calculatedTotal = 0;
    
    // Pre-validate all crops and stock before saving anything
    const cropsToUpdate = [];
    for (const item of items) {
      const crop = await Crop.findById(item.cropId);
      if (!crop) {
        return res.status(404).json({ success: false, message: `Crop not found: ${item.cropId}` });
      }
      if (crop.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for ${crop.name}. Available: ${crop.quantity}` });
      }
      
      calculatedTotal += crop.price * item.quantity;
      cropsToUpdate.push({ crop, deductQty: item.quantity });
    }

    // Deduct the stock exactly since we passed validation
    for (const { crop, deductQty } of cropsToUpdate) {
      crop.quantity -= deductQty;
      await crop.save();
    }

    // Step 4 functionality: Payment Simulation Logic
    let paymentStatus = 'pending';
    
    if (paymentMethod === 'ONLINE') {
      // Add a 1.5-second artificial delay to fake payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate success
      paymentStatus = 'completed';
    } else if (paymentMethod === 'COD') {
      // Cash on delivery requires no processing
      paymentStatus = 'pending';
    }

    const order = new Order({
      buyerId,
      items,
      totalAmount: calculatedTotal,
      paymentMethod,
      paymentStatus,
      orderStatus: 'placed' // Base status
    });

    const createdOrder = await order.save();
    res.status(201).json({ success: true, data: createdOrder });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error processing checkout', error: error.message });
  }
};

module.exports = { createOrder };
