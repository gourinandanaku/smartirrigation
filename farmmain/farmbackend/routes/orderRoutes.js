const express = require('express');
const router = express.Router();
const { createOrder, getOrders, cancelOrder } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/', getOrders);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
