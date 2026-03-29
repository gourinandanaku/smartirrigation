const Order = require('../models/Order');
const Crop = require('../models/Crop');

// Helper for rolling back stock if a multi-item cart order fails halfway
const rollbackStock = async (reservedCrops) => {
  for (const reserved of reservedCrops) {
    await Crop.findByIdAndUpdate(reserved.cropId, { $inc: { quantity: reserved.quantity } });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Public
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: 'items.cropId',
      model: 'Crop'
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error(`[Get Orders Failed] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error fetching orders', error: error.message });
  }
};

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

    let calculatedTotal = 0;
    const reservedCrops = []; // STEP 4: Array to hold items for safe rollback

    // STEP 1, 2, 4, 5, 6: Secure Atomic Stock Verification and Update!
    for (const item of items) {
      console.log(`[Checkout] Checking stock for Crop ID: ${item.cropId}. Requested: ${item.quantity}`);
      
      // Step 5: Prevent race conditions using findOneAndUpdate with $gte condition
      const updatedCrop = await Crop.findOneAndUpdate(
        { _id: item.cropId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: false } // Returns the original document state so we can calculate price securely
      );

      // Step 1: Handle failure (Insufficient Stock)
      if (!updatedCrop) {
        // Determine exactly why it failed to provide a precise debug message
        const failedCrop = await Crop.findById(item.cropId);
        
        // Rollback any items that were successfully decremented already in this cart
        await rollbackStock(reservedCrops);

        if (!failedCrop) {
          return res.status(404).json({ success: false, message: `Crop not found: ${item.cropId}` });
        } else {
          console.error(`[Checkout Failed] Insufficient stock for ${failedCrop.name}. Available: ${failedCrop.quantity}, Requested: ${item.quantity}`);
          return res.status(400).json({ success: false, message: `Insufficient stock for ${failedCrop.name}` }); // Step 1 required message structure
        }
      }

      console.log(`[Checkout] Successfully reserved ${item.quantity}kg of ${updatedCrop.name}. Remaining: ${updatedCrop.quantity - item.quantity}`);
      calculatedTotal += updatedCrop.price * item.quantity;
      reservedCrops.push({ cropId: item.cropId, quantity: item.quantity });
    }

    // Payment Simulation Logic
    let paymentStatus = 'pending';
    if (paymentMethod === 'ONLINE') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      paymentStatus = 'completed';
    }

    const order = new Order({
      buyerId,
      items,
      totalAmount: calculatedTotal,
      paymentMethod,
      paymentStatus,
      orderStatus: 'placed' 
    });

    const createdOrder = await order.save();
    console.log(`[Checkout Success] Order ${createdOrder._id} finalized successfully.`);
    res.status(201).json({ success: true, data: createdOrder });

  } catch (error) {
    console.error(`[Checkout Panic] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error processing checkout', error: error.message });
  }
};

// @desc    Cancel an order & restore stock
// @route   PUT /api/orders/:id/cancel
// @access  Public
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.orderStatus !== 'placed') {
      return res.status(400).json({ success: false, message: `Cannot cancel order in '${order.orderStatus}' status` });
    }

    // Step 1: Restore stock
    for (const item of order.items) {
      await Crop.findByIdAndUpdate(item.cropId, { $inc: { quantity: item.quantity } });
      console.log(`[Order Cancelled] Restored ${item.quantity}kg of Crop ID ${item.cropId}`);
    }

    // Step 2: Update order status
    order.orderStatus = 'cancelled';
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error(`[Order Cancellation Failed] ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error during order cancellation', error: error.message });
  }
};

module.exports = { createOrder, getOrders, cancelOrder };
